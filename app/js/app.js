import { buildRecordFromState, getSerializableFormSnapshot, getFuturePersistenceHooks, prepareExportPayload } from "./data-model.js";
import { calculateBMI, calculateMaxHeartRate, calculateTrainingZones, classifyBMI } from "./calculations.js";
import { exportToExcel, getExcelFileName } from "./excel-export.js";
import { generateIndividualPDF } from "./pdf-export.js";
import { addRecord, clearAllRecords, deleteRecord, exportJSON, importJSON, loadRecords, updateRecord } from "./storage-manager.js";
import { createUIController } from "./ui.js";
import { sanitizeFieldValue, validateForm } from "./validators.js";

const FIELD_NAMES = [
  "name",
  "age",
  "weight",
  "height",
  "p1",
  "testLocation",
  "testDistance",
  "testStops",
  "testPulseStart",
  "testTime",
  "testPulseEnd",
  "testPulse1Min",
  "testPulse5Min",
  "strengthPushUpsReps",
  "strengthPushUpsTime",
  "strengthPushUpsObservations",
  "strengthAbsReps",
  "strengthAbsTime",
  "strengthStandingLongJump",
  "strengthSpeed14m",
  "strengthZoneDisplacement",
  "strengthVerticalJump"
];

function createInitialState() {
  return {
    values: {
      name: "",
      age: null,
      weight: null,
      height: null,
      p1: 60,
      testLocation: "",
      testDistance: null,
      testStops: 0,
      testPulseStart: null,
      testTimeText: "",
      testTimeSeconds: null,
      testPulseEnd: null,
      testPulse1Min: null,
      testPulse5Min: null,
      strengthPushUpsReps: null,
      strengthPushUpsTimeText: "",
      strengthPushUpsTimeSeconds: null,
      strengthPushUpsObservations: "",
      strengthAbsReps: null,
      strengthAbsTimeText: "",
      strengthAbsTimeSeconds: null,
      strengthStandingLongJump: null,
      strengthSpeed14m: null,
      strengthZoneDisplacement: null,
      strengthVerticalJump: null
    },
    computed: {
      pm: null,
      zones: [],
      bmi: null,
      bmiRange: null
    },
    validation: {
      name: { isValid: true, message: "" },
      age: { isValid: true, message: "" },
      weight: { isValid: true, message: "" },
      height: { isValid: true, message: "" },
      p1: { isValid: true, message: "" },
      testLocation: { isValid: true, message: "" },
      testDistance: { isValid: true, message: "" },
      testStops: { isValid: true, message: "" },
      testPulseStart: { isValid: true, message: "" },
      testTime: { isValid: true, message: "" },
      testPulseEnd: { isValid: true, message: "" },
      testPulse1Min: { isValid: true, message: "" },
      testPulse5Min: { isValid: true, message: "" },
      strengthPushUpsReps: { isValid: true, message: "" },
      strengthPushUpsTime: { isValid: true, message: "" },
      strengthPushUpsObservations: { isValid: true, message: "" },
      strengthAbsReps: { isValid: true, message: "" },
      strengthAbsTime: { isValid: true, message: "" },
      strengthStandingLongJump: { isValid: true, message: "" },
      strengthSpeed14m: { isValid: true, message: "" },
      strengthZoneDisplacement: { isValid: true, message: "" },
      strengthVerticalJump: { isValid: true, message: "" }
    },
    persistence: getFuturePersistenceHooks()
  };
}

function createPersistenceState() {
  const records = loadRecords();

  return {
    records,
    editingRecordId: null,
    feedback: {
      type: "info",
      text: records.length
        ? `Historial cargado desde localStorage con ${records.length} registro(s).`
        : "Aun no hay registros guardados en el almacenamiento local."
    }
  };
}

function getRawFields(formElement) {
  const formData = new FormData(formElement);
  return Object.fromEntries(
    FIELD_NAMES.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? "").trim()])
  );
}

function computeDerivedState(values) {
  const pm = calculateMaxHeartRate(values.age);
  const zones = calculateTrainingZones(pm, values.p1);
  const bmi = calculateBMI(values.weight, values.height);
  const bmiRange = classifyBMI(bmi);

  return {
    pm,
    zones,
    bmi,
    bmiRange
  };
}

function updateFormState(state, formElement) {
  const rawFields = getRawFields(formElement);
  const validation = validateForm(rawFields);

  state.values = {
    name: rawFields.name,
    age: validation.age.parsedValue,
    weight: validation.weight.parsedValue,
    height: validation.height.parsedValue,
    p1: validation.p1.parsedValue,
    testLocation: validation.testLocation.parsedValue ?? "",
    testDistance: validation.testDistance.parsedValue,
    testStops: validation.testStops.parsedValue,
    testPulseStart: validation.testPulseStart.parsedValue,
    testTimeText: validation.testTime.parsedValue ?? "",
    testTimeSeconds: validation.testTime.seconds ?? null,
    testPulseEnd: validation.testPulseEnd.parsedValue,
    testPulse1Min: validation.testPulse1Min.parsedValue,
    testPulse5Min: validation.testPulse5Min.parsedValue,
    strengthPushUpsReps: validation.strengthPushUpsReps.parsedValue,
    strengthPushUpsTimeText: validation.strengthPushUpsTime.parsedValue ?? "",
    strengthPushUpsTimeSeconds: validation.strengthPushUpsTime.seconds ?? null,
    strengthPushUpsObservations: validation.strengthPushUpsObservations.parsedValue ?? "",
    strengthAbsReps: validation.strengthAbsReps.parsedValue,
    strengthAbsTimeText: validation.strengthAbsTime.parsedValue ?? "",
    strengthAbsTimeSeconds: validation.strengthAbsTime.seconds ?? null,
    strengthStandingLongJump: validation.strengthStandingLongJump.parsedValue,
    strengthSpeed14m: validation.strengthSpeed14m.parsedValue,
    strengthZoneDisplacement: validation.strengthZoneDisplacement.parsedValue,
    strengthVerticalJump: validation.strengthVerticalJump.parsedValue
  };

  state.validation = validation;
  state.computed = computeDerivedState(state.values);
}

function attachInputSanitizers(formElement) {
  formElement.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
      return;
    }

    const sanitized = sanitizeFieldValue(target.name, target.value);
    if (sanitized !== target.value) {
      target.value = sanitized;
    }
  });
}

function attachRealtimeUpdates({ formElement, state, ui }) {
  const sync = () => {
    updateFormState(state, formElement);
    const record = buildRecordFromState(state);
    const exportPayload = prepareExportPayload(state);
    ui.render(state, record, exportPayload, window.persistenceState);

    window.appState = {
      snapshot: getSerializableFormSnapshot(state),
      exportPayload,
      records: window.persistenceState?.records ?? []
    };
  };

  formElement.addEventListener("input", sync);
  formElement.addEventListener("change", sync);
  sync();

  return sync;
}

function hasRequiredFields(state) {
  return Boolean(
    state.values.name &&
    state.values.age !== null &&
    state.values.weight !== null &&
    state.values.height !== null &&
    state.values.testStops !== null &&
    Object.values(state.validation).every((fieldState) => fieldState.isValid)
  );
}

function updateSessionFeedback(persistenceState, type, text) {
  persistenceState.feedback = { type, text };
}

function resetFormForNewRecord(formElement, persistenceState, sync) {
  formElement.reset();

  const p1Input = formElement.elements.namedItem("p1");
  if (p1Input instanceof HTMLInputElement) {
    p1Input.value = "60";
  }

  const testStopsInput = formElement.elements.namedItem("testStops");
  if (testStopsInput instanceof HTMLInputElement) {
    testStopsInput.value = "0";
  }

  persistenceState.editingRecordId = null;
  updateSessionFeedback(persistenceState, "success", "Formulario reiniciado. Listo para un nuevo registro.");
  sync();
}

function populateFormFromRecord(formElement, record) {
  const fieldMap = {
    name: record.nombre,
    age: record.edad,
    weight: record.peso,
    height: record.altura,
    p1: record.p1,
    testLocation: record.testLugar,
    testDistance: record.testDistanciaMetros,
    testStops: record.testDetenciones ?? 0,
    testPulseStart: record.testPulsoInicio,
    testTime: record.testTiempoTexto,
    testPulseEnd: record.testPulsoFinal,
    testPulse1Min: record.testPulso1Min,
    testPulse5Min: record.testPulso5Min,
    strengthPushUpsReps: record.testFuerzaFlexionesCodo,
    strengthPushUpsTime: record.testFuerzaFlexionesCodoTiempoTexto,
    strengthPushUpsObservations: record.testFuerzaObservacionesFlexionesCodo,
    strengthAbsReps: record.testFuerzaAbdominales,
    strengthAbsTime: record.testFuerzaAbdominalesTiempoTexto,
    strengthStandingLongJump: record.testFuerzaSaltoSinImpulso,
    strengthSpeed14m: record.testFuerzaVelocidad14m,
    strengthZoneDisplacement: record.testFuerzaDesplazamientoZona,
    strengthVerticalJump: record.testFuerzaSaltoVertical
  };

  Object.entries(fieldMap).forEach(([fieldName, fieldValue]) => {
    const input = formElement.elements.namedItem(fieldName);

    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.value = fieldValue ?? "";
    }
  });
}

function buildPersistedRecord(state, persistenceState) {
  const baseRecord = buildRecordFromState(state);

  if (!persistenceState.editingRecordId) {
    return baseRecord;
  }

  const existingRecord = persistenceState.records.find((record) => record.id === persistenceState.editingRecordId);

  if (!existingRecord) {
    return baseRecord;
  }

  return {
    ...baseRecord,
    id: existingRecord.id,
    createdAt: existingRecord.createdAt
  };
}

function attachPersistenceActions({ formElement, state, persistenceState, ui, sync }) {
  const saveButton = document.querySelector("#save-record-btn");
  const resetButton = document.querySelector("#reset-form-btn");
  const downloadButton = document.querySelector("#download-excel-btn");
  const exportJsonButton = document.querySelector("#export-json-btn");
  const importJsonButton = document.querySelector("#import-json-btn");
  const clearHistoryButton = document.querySelector("#clear-history-btn");
  const importJsonInput = document.querySelector("#import-json-input");
  const historyBody = document.querySelector("#history-table-body");
  const recordModal = document.querySelector("#record-detail-modal");

  if (
    !(saveButton instanceof HTMLButtonElement) ||
    !(resetButton instanceof HTMLButtonElement) ||
    !(downloadButton instanceof HTMLButtonElement) ||
    !(exportJsonButton instanceof HTMLButtonElement) ||
    !(importJsonButton instanceof HTMLButtonElement) ||
    !(clearHistoryButton instanceof HTMLButtonElement) ||
    !(importJsonInput instanceof HTMLInputElement) ||
    !(historyBody instanceof HTMLTableSectionElement) ||
    !(recordModal instanceof HTMLDivElement)
  ) {
    return;
  }

  function getRecordById(recordId) {
    return persistenceState.records.find((record) => record.id === recordId) ?? null;
  }

  async function downloadRecordPdf(record) {
    try {
      await generateIndividualPDF(record);
      updateSessionFeedback(persistenceState, "success", "PDF individual descargado correctamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible generar el PDF del registro.";
      updateSessionFeedback(persistenceState, "error", message);
    }

    ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
  }

  function loadRecordForEditing(recordId, record) {
    populateFormFromRecord(formElement, record);
    persistenceState.editingRecordId = recordId;
    ui.closeRecordModal();
    updateSessionFeedback(persistenceState, "info", "Registro cargado en el formulario para edicion.");
    sync();
    formElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeRecord(recordId) {
    persistenceState.records = deleteRecord(recordId);

    if (persistenceState.editingRecordId === recordId) {
      persistenceState.editingRecordId = null;
    }

    ui.closeRecordModal();
    updateSessionFeedback(persistenceState, "success", "Registro eliminado del historial persistente.");
    ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
  }

  saveButton.addEventListener("click", () => {
    sync();

    if (!hasRequiredFields(state)) {
      updateSessionFeedback(persistenceState, "error", "No se puede guardar, faltan datos obligatorios.");
      ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
      return;
    }

    const record = buildPersistedRecord(state, persistenceState);

    if (persistenceState.editingRecordId) {
      persistenceState.records = updateRecord(persistenceState.editingRecordId, record);
      persistenceState.editingRecordId = null;
      updateSessionFeedback(persistenceState, "success", "Registro actualizado y guardado en localStorage.");
    } else {
      persistenceState.records = addRecord(record);
      updateSessionFeedback(persistenceState, "success", `Registro guardado en localStorage. Total persistido: ${persistenceState.records.length}.`);
    }

    ui.render(state, record, prepareExportPayload(state), persistenceState);
  });

  resetButton.addEventListener("click", () => {
    resetFormForNewRecord(formElement, persistenceState, sync);
  });

  downloadButton.addEventListener("click", () => {
    sync();

    persistenceState.records = loadRecords();

    if (!persistenceState.records.length) {
      updateSessionFeedback(persistenceState, "error", "Primero guarda al menos un registro antes de descargar el Excel.");
      ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
      return;
    }

    exportToExcel(persistenceState.records, getExcelFileName());
    updateSessionFeedback(persistenceState, "success", `Excel descargado con ${persistenceState.records.length} registro(s) persistidos.`);
    ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
  });

  exportJsonButton.addEventListener("click", () => {
    persistenceState.records = loadRecords();

    if (!persistenceState.records.length) {
      updateSessionFeedback(persistenceState, "error", "No hay registros para exportar en JSON.");
      ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
      return;
    }

    exportJSON(persistenceState.records);
    updateSessionFeedback(persistenceState, "success", `Respaldo JSON exportado con ${persistenceState.records.length} registro(s).`);
    ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
  });

  importJsonButton.addEventListener("click", () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener("change", async () => {
    const [file] = Array.from(importJsonInput.files ?? []);

    if (!file) {
      return;
    }

    try {
      persistenceState.records = await importJSON(file);
      persistenceState.editingRecordId = null;
      updateSessionFeedback(persistenceState, "success", `JSON importado correctamente. Total persistido: ${persistenceState.records.length}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible importar el archivo JSON.";
      updateSessionFeedback(persistenceState, "error", message);
    }

    importJsonInput.value = "";
    ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
  });

  clearHistoryButton.addEventListener("click", () => {
    const confirmed = window.confirm("¿Seguro que deseas eliminar todos los registros?");

    if (!confirmed) {
      return;
    }

    persistenceState.records = clearAllRecords();
    persistenceState.editingRecordId = null;
    updateSessionFeedback(persistenceState, "success", "Historial eliminado por completo del almacenamiento local.");
    ui.render(state, buildRecordFromState(state), prepareExportPayload(state), persistenceState);
  });

  historyBody.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const action = target.dataset.action;
    const recordId = target.dataset.id;

    if (!action || !recordId) {
      return;
    }

    if (action === "delete") {
      removeRecord(recordId);
      return;
    }

    if (action === "view") {
      const record = getRecordById(recordId);

      if (!record) {
        return;
      }

      ui.openRecordModal(record);
      return;
    }

    if (action === "pdf") {
      const record = getRecordById(recordId);

      if (!record) {
        return;
      }

      await downloadRecordPdf(record);
      return;
    }

    if (action === "edit") {
      const record = getRecordById(recordId);

      if (!record) {
        return;
      }

      loadRecordForEditing(recordId, record);
    }
  });

  recordModal.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const recordId = target.dataset.id;

    if (!recordId) {
      return;
    }

    const record = getRecordById(recordId);

    if (!record) {
      ui.closeRecordModal();
      return;
    }

    if (target.id === "record-modal-pdf-btn") {
      await downloadRecordPdf(record);
      return;
    }

    if (target.id === "record-modal-edit-btn") {
      loadRecordForEditing(recordId, record);
      return;
    }

    if (target.id === "record-modal-delete-btn") {
      const confirmed = window.confirm("¿Seguro que deseas eliminar este registro?");

      if (!confirmed) {
        return;
      }

      removeRecord(recordId);
    }
  });
}

function initializeApp() {
  const formElement = document.querySelector("#health-form");

  if (!formElement) {
    return;
  }

  const state = createInitialState();
  const persistenceState = createPersistenceState();
  const ui = createUIController(document);
  window.persistenceState = persistenceState;

  attachInputSanitizers(formElement);
  const sync = attachRealtimeUpdates({ formElement, state, ui });
  attachPersistenceActions({ formElement, state, persistenceState, ui, sync });
}

initializeApp();
