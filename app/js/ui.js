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

function createPreviewPayload(record, exportPayload) {
  return {
    record,
    exportRow: exportPayload?.exportRow ?? null
  };
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

function createHistoryRowMarkup(record) {
  return `
    <tr>
      <td>${record.nombre || "Sin nombre"}</td>
      <td>${formatHistoryDate(record.createdAt)}</td>
      <td>${record.edad ?? "--"}</td>
      <td>${record.imc ?? "--"}</td>
      <td>${record.pm ?? "--"}</td>
      <td>${displayValue(record.testDistanciaMetros, "m")}</td>
      <td>
        <div class="history-actions">
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
    recordPreview: documentRef.querySelector("#record-preview"),
    errorFields: Array.from(documentRef.querySelectorAll("[data-error-for]"))
  };

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

  function renderRecordPreview(record, exportPayload) {
    elements.recordPreview.textContent = JSON.stringify(createPreviewPayload(record, exportPayload), null, 2);
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
          <td colspan="7">Todavia no hay registros guardados en el almacenamiento local.</td>
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
    renderRecordPreview(record, exportPayload);
    renderSession(session);
  }

  return {
    render
  };
}
