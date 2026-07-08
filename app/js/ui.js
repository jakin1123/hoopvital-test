import { BMI_RANGES, formatBMI, formatRangeLabel } from "./calculations.js";

function displayValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return suffix ? `${value} ${suffix}` : String(value);
}

function createZoneRowMarkup(zone) {
  const min = zone?.min ?? "--";
  const max = zone?.max ?? "--";

  return `
    <tr class="${zone.rowClass}">
      <td>${min}</td>
      <td>${zone.label}</td>
      <td>${max}</td>
    </tr>
  `;
}

function createBmiReferenceRowMarkup(range, activeLabel) {
  const isActive = activeLabel === range.label;
  return `
    <tr class="${isActive ? "is-active" : ""}">
      <td>${formatRangeLabel(range)}</td>
      <td>${range.label}</td>
    </tr>
  `;
}

function formatHistoryDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatZoneValue(min, max) {
  if (min === null || min === undefined || max === null || max === undefined) {
    return "--";
  }

  return `${min} - ${max} ppm`;
}

function createDetailRowMarkup(label, value) {
  return `
    <div class="record-modal__item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function createDetailSectionMarkup(title, items) {
  return `
    <section class="record-modal__section">
      <h3>${title}</h3>
      <div class="record-modal__grid">
        ${items.map(([label, value]) => createDetailRowMarkup(label, value)).join("")}
      </div>
    </section>
  `;
}

function createRecordDetailMarkup(record) {
  const sections = [
    {
      title: "Datos personales",
      items: [
        ["Nombre", displayValue(record.nombre)],
        ["Fecha de registro", formatHistoryDate(record.createdAt)],
        ["Edad", displayValue(record.edad, "años")],
        ["Peso", displayValue(record.peso, "kg")],
        ["Altura", displayValue(record.altura, "m")]
      ]
    },
    {
      title: "Resultados fisiologicos",
      items: [
        ["Pulso basal", displayValue(record.p1, "ppm")],
        ["Pulsaciones maximas", displayValue(record.pm, "ppm")],
        ["IMC", displayValue(record.imc)],
        ["Clasificacion IMC", displayValue(record.clasificacionIMC)]
      ]
    },
    {
      title: "Zonas cardiovasculares",
      items: [
        ["Zona A1", formatZoneValue(record.zonaA1Min, record.zonaA1Max)],
        ["Zona A2", formatZoneValue(record.zonaA2Min, record.zonaA2Max)],
        ["Zona A3", formatZoneValue(record.zonaA3Min, record.zonaA3Max)],
        ["Zona A4", formatZoneValue(record.zonaA4Min, record.zonaA4Max)],
        ["Zona A5", formatZoneValue(record.zonaA5Min, record.zonaA5Max)]
      ]
    },
    {
      title: "Test fisico",
      items: [
        ["Lugar del test", displayValue(record.testLugar)],
        ["Distancia", displayValue(record.testDistanciaMetros, "m")],
        ["Detenciones", displayValue(record.testDetenciones, "veces")],
        ["Pulso de inicio", displayValue(record.testPulsoInicio, "pul")],
        ["Tiempo del test", displayValue(record.testTiempoTexto)],
        ["Pulso final", displayValue(record.testPulsoFinal, "pul")],
        ["Pulso al minuto 1", displayValue(record.testPulso1Min, "pul")],
        ["Pulso al minuto 5", displayValue(record.testPulso5Min, "pul")]
      ]
    },
    {
      title: "Test de fuerza",
      items: [
        ["Flexiones de codo", displayValue(record.testFuerzaFlexionesCodo, "reps")],
        ["Tiempo flexiones", displayValue(record.testFuerzaFlexionesCodoTiempoTexto)],
        ["Obs. flexiones", displayValue(record.testFuerzaObservacionesFlexionesCodo)],
        ["Abdominales", displayValue(record.testFuerzaAbdominales, "reps")],
        ["Tiempo abdominales", displayValue(record.testFuerzaAbdominalesTiempoTexto)],
        ["Salto sin impulso", displayValue(record.testFuerzaSaltoSinImpulso, "m")],
        ["Velocidad 14 m", displayValue(record.testFuerzaVelocidad14m, "s")],
        ["Desplazamiento zona", displayValue(record.testFuerzaDesplazamientoZona, "s")],
        ["Salto vertical", displayValue(record.testFuerzaSaltoVertical, "m")]
      ]
    }
  ];

  return sections.map((section) => createDetailSectionMarkup(section.title, section.items)).join("");
}

function createHistoryRowMarkup(record) {
  return `
    <tr>
      <td>${record.nombre || "Sin nombre"}</td>
      <td>${formatHistoryDate(record.createdAt)}</td>
      <td>${record.edad ?? "--"}</td>
      <td>${displayValue(record.altura, "m")}</td>
      <td>${displayValue(record.peso, "kg")}</td>
      <td>
        <div class="history-actions">
          <button class="history-action-button history-action-button--view" type="button" data-action="view" data-id="${record.id}">Ver</button>
          <button class="history-action-button history-action-button--edit" type="button" data-action="edit" data-id="${record.id}">Editar</button>
          <button class="history-action-button history-action-button--delete" type="button" data-action="delete" data-id="${record.id}">Eliminar</button>
          <button class="history-action-button history-action-button--pdf" type="button" data-action="pdf" data-id="${record.id}">PDF</button>
        </div>
      </td>
    </tr>
  `;
}

export function createUIController(documentRef = document) {
  const elements = {
    pmValue: documentRef.querySelector("#pm-value"),
    zonesTableBody: documentRef.querySelector("#zones-table-body"),
    summaryWeight: documentRef.querySelector("#summary-weight"),
    summaryHeight: documentRef.querySelector("#summary-height"),
    bmiValue: documentRef.querySelector("#bmi-value"),
    bmiCategory: documentRef.querySelector("#bmi-category"),
    bmiReferenceBody: documentRef.querySelector("#bmi-reference-body"),
    historyBody: documentRef.querySelector("#history-table-body"),
    historyCount: documentRef.querySelector("#history-count"),
    saveFeedback: documentRef.querySelector("#save-feedback"),
    recordModal: documentRef.querySelector("#record-detail-modal"),
    recordModalPanel: documentRef.querySelector(".record-modal__panel"),
    recordModalBody: documentRef.querySelector("#record-modal-body"),
    recordModalTitle: documentRef.querySelector("#record-modal-title"),
    recordModalEditButton: documentRef.querySelector("#record-modal-edit-btn"),
    recordModalDeleteButton: documentRef.querySelector("#record-modal-delete-btn"),
    recordModalPdfButton: documentRef.querySelector("#record-modal-pdf-btn"),
    errorFields: Array.from(documentRef.querySelectorAll("[data-error-for]"))
  };

  function setModalRecordId(recordId = "") {
    const normalizedId = recordId || "";

    [
      elements.recordModalEditButton,
      elements.recordModalDeleteButton,
      elements.recordModalPdfButton
    ].forEach((button) => {
      if (button) {
        button.dataset.id = normalizedId;
      }
    });

    if (elements.recordModalPanel) {
      elements.recordModalPanel.dataset.recordId = normalizedId;
    }
  }

  function closeRecordModal() {
    if (!elements.recordModal) {
      return;
    }

    elements.recordModal.hidden = true;
    if (elements.recordModalTitle) {
      elements.recordModalTitle.textContent = "Informacion del atleta";
    }
    setModalRecordId("");
    documentRef.body.classList.remove("is-modal-open");
    documentRef.documentElement.classList.remove("is-modal-open");
  }

  function openRecordModal(record) {
    if (!elements.recordModal || !elements.recordModalBody) {
      return;
    }

    elements.recordModalBody.innerHTML = createRecordDetailMarkup(record);
    if (elements.recordModalTitle) {
      elements.recordModalTitle.textContent = `Informacion del atleta: ${record.nombre || "Sin nombre"}`;
    }
    setModalRecordId(record.id);
    elements.recordModal.hidden = false;
    documentRef.body.classList.add("is-modal-open");
    documentRef.documentElement.classList.add("is-modal-open");
  }

  elements.recordModal?.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute("data-modal-close")) {
      closeRecordModal();
    }
  });

  documentRef.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.recordModal && !elements.recordModal.hidden) {
      closeRecordModal();
    }
  });

  function renderValidation(validation) {
    elements.errorFields.forEach((errorField) => {
      const key = errorField.dataset.errorFor;
      const currentValidation = validation[key];
      const input = documentRef.querySelector(`#${key}`);
      const message = currentValidation?.message ?? "";

      errorField.textContent = message;
      if (input) {
        input.setAttribute("aria-invalid", String(Boolean(message)));
      }
    });
  }

  function renderZones(zones) {
    if (!zones.length) {
      elements.zonesTableBody.innerHTML = [
        { label: "Zona A5", min: "--", max: "--", rowClass: "zone-a5" },
        { label: "Zona A4", min: "--", max: "--", rowClass: "zone-a4" },
        { label: "Zona A3", min: "--", max: "--", rowClass: "zone-a3" },
        { label: "Zona A2", min: "--", max: "--", rowClass: "zone-a2" },
        { label: "Zona A1", min: "--", max: "--", rowClass: "zone-a1" }
      ].map(createZoneRowMarkup).join("");
      return;
    }

    elements.zonesTableBody.innerHTML = zones.map(createZoneRowMarkup).join("");
  }

  function renderBmiSummary(values, computed) {
    elements.summaryWeight.textContent = displayValue(values.weight, "kg");
    elements.summaryHeight.textContent = displayValue(values.height, "m");
    elements.bmiValue.textContent = formatBMI(computed.bmi);
    elements.bmiCategory.textContent = computed.bmiRange?.label ?? "Sin datos suficientes";
  }

  function renderBmiReference(computed) {
    const activeLabel = computed.bmiRange?.label ?? "";
    elements.bmiReferenceBody.innerHTML = BMI_RANGES.map((range) => createBmiReferenceRowMarkup(range, activeLabel)).join("");
  }

  function renderSession(session) {
    const records = session?.records ?? [];
    const feedback = session?.feedback ?? { type: "info", text: "Aun no hay registros guardados en el almacenamiento local." };
    const isEditing = Boolean(session?.editingRecordId);

    elements.historyCount.textContent = String(records.length);
    elements.saveFeedback.textContent = feedback.text;
    elements.saveFeedback.className = `feedback-message ${feedback.type === "success" ? "is-success" : ""} ${feedback.type === "error" ? "is-error" : ""}`.trim();

    const saveButton = documentRef.querySelector("#save-record-btn");
    if (saveButton) {
      saveButton.textContent = isEditing ? "Actualizar registro" : "Guardar registro";
    }

    if (!records.length) {
      elements.historyBody.innerHTML = `
        <tr class="history-table__empty-row">
          <td colspan="6">Todavia no hay registros guardados en el almacenamiento local.</td>
        </tr>
      `;
      return;
    }

    elements.historyBody.innerHTML = records.map(createHistoryRowMarkup).join("");
  }

  function render(state, record, exportPayload, session) {
    elements.pmValue.textContent = state.computed.pm ?? "--";
    renderZones(state.computed.zones);
    renderBmiSummary(state.values, state.computed);
    renderBmiReference(state.computed);
    renderValidation(state.validation);
    renderSession(session);
  }

  return {
    render,
    openRecordModal,
    closeRecordModal
  };
}
