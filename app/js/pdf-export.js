function ensurePdfAvailability() {
  const jsPdfLib = window.jspdf?.jsPDF;

  if (!jsPdfLib) {
    throw new Error("La libreria jsPDF no esta disponible.");
  }

  return jsPdfLib;
}

const PDF_HEADER_LOGO_PATH = "./assets/branding/hoop-vital-logo.webp";
let cachedHeaderLogoPromise = null;

function sanitizeFilePart(value) {
  return String(value ?? "sin-dato")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "sin-dato";
}

function formatDisplayDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatFileDate(value) {
  if (!value) {
    return "sin-fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return sanitizeFilePart(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return suffix ? `${value} ${suffix}` : String(value);
}

function hasStrengthData(record) {
  return [
    record.testFuerzaFlexionesCodo,
    record.testFuerzaFlexionesCodoTiempoTexto,
    record.testFuerzaObservacionesFlexionesCodo,
    record.testFuerzaAbdominales,
    record.testFuerzaAbdominalesTiempoTexto,
    record.testFuerzaSaltoSinImpulso,
    record.testFuerzaVelocidad14m,
    record.testFuerzaDesplazamientoZona,
    record.testFuerzaSaltoVertical
  ].some((value) => value !== null && value !== undefined && value !== "");
}

function buildZoneLabel(min, max) {
  if (min === null || min === undefined || max === null || max === undefined) {
    return "--";
  }

  return `${min} - ${max} ppm`;
}

function loadCircularHeaderLogo() {
  if (cachedHeaderLogoPromise) {
    return cachedHeaderLogoPromise;
  }

  cachedHeaderLogoPromise = new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - sourceSize) / 2;
      const sourceY = (image.naturalHeight - sourceSize) / 2;
      const canvas = document.createElement("canvas");
      const outputSize = 320;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("No fue posible preparar el logo del PDF."));
        return;
      }

      context.beginPath();
      context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);

      resolve(canvas.toDataURL("image/png"));
    }, { once: true });

    image.addEventListener("error", () => {
      reject(new Error("No fue posible cargar el logo del PDF."));
    }, { once: true });

    image.src = PDF_HEADER_LOGO_PATH;
  });

  return cachedHeaderLogoPromise;
}

export function buildPDFFileName(record) {
  const namePart = sanitizeFilePart(record.nombre || "sin_nombre");
  const datePart = formatFileDate(record.createdAt);
  return `evaluacion_${namePart}_${datePart}.pdf`;
}

export function formatRecordForPDF(record) {
  return {
    personalData: [
      ["Nombre", formatValue(record.nombre)],
      ["Edad", formatValue(record.edad, "años")],
      ["Peso", formatValue(record.peso, "kg")],
      ["Altura", formatValue(record.altura, "m")],
      ["Fecha de registro", formatDisplayDate(record.createdAt)]
    ],
    physiologicalResults: [
      ["Pulso basal", formatValue(record.p1, "ppm")]
    ],
    zones: [
      ["A1", buildZoneLabel(record.zonaA1Min, record.zonaA1Max)],
      ["A2", buildZoneLabel(record.zonaA2Min, record.zonaA2Max)],
      ["A3", buildZoneLabel(record.zonaA3Min, record.zonaA3Max)],
      ["A4", buildZoneLabel(record.zonaA4Min, record.zonaA4Max)],
      ["A5", buildZoneLabel(record.zonaA5Min, record.zonaA5Max)]
    ],
    testData: [
      ["Lugar del test", formatValue(record.testLugar)],
      ["Distancia lograda", formatValue(record.testDistanciaMetros, "m")],
      ["Detenciones", formatValue(record.testDetenciones, "veces")],
      ["Pulso de inicio", formatValue(record.testPulsoInicio, "pul")],
      ["Tiempo del test", formatValue(record.testTiempoTexto)],
      ["Pulso final", formatValue(record.testPulsoFinal, "pul")],
      ["Pulso al minuto 1", formatValue(record.testPulso1Min, "pul")],
      ["Pulso al minuto 5", formatValue(record.testPulso5Min, "pul")]
    ],
    strengthData: [
      ["Flexiones de codo", formatValue(record.testFuerzaFlexionesCodo, "reps")],
      ["Tiempo flexiones", formatValue(record.testFuerzaFlexionesCodoTiempoTexto)],
      ["Obs. flexiones", formatValue(record.testFuerzaObservacionesFlexionesCodo)],
      ["Abdominales", formatValue(record.testFuerzaAbdominales, "reps")],
      ["Tiempo abdominales", formatValue(record.testFuerzaAbdominalesTiempoTexto)],
      ["Salto sin impulso", formatValue(record.testFuerzaSaltoSinImpulso, "m")],
      ["Velocidad 14 m", formatValue(record.testFuerzaVelocidad14m, "s")],
      ["Desplazamiento zona", formatValue(record.testFuerzaDesplazamientoZona, "s")],
      ["Salto vertical", formatValue(record.testFuerzaSaltoVertical, "m")]
    ]
  };
}

function drawHeader(doc, logoDataUrl = null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(31, 91, 196);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("EVALUACION FISICA", 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Reporte individual de resultados", 14, 22);

  if (logoDataUrl) {
    const logoSize = 18;
    const logoX = pageWidth - 14 - logoSize;
    const logoY = 5;

    doc.setFillColor(255, 255, 255);
    doc.circle(logoX + (logoSize / 2), logoY + (logoSize / 2), (logoSize / 2) + 1.1, "F");
    doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoSize, logoSize);
  }

  doc.setDrawColor(20, 149, 107);
  doc.setLineWidth(1.2);
  doc.line(14, 33, 196, 33);
  doc.setTextColor(23, 32, 51);
}

function drawKpiCards(doc, record) {
  const cardY = 40;
  const cardWidth = 56;
  const cardHeight = 24;
  const cardGap = 8;
  const cards = [
    { label: "Pulsaciones max.", value: formatValue(record.pm, "ppm") },
    { label: "IMC", value: formatValue(record.imc) },
    { label: "Clasificacion IMC", value: formatValue(record.clasificacionIMC) }
  ];

  cards.forEach((card, index) => {
    const x = 14 + ((cardWidth + cardGap) * index);
    doc.setFillColor(247, 250, 255);
    doc.setDrawColor(210, 222, 239);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(card.label.length > 14 ? 7.4 : 8.5);
    doc.setTextColor(112, 128, 153);
    doc.text(card.label.toUpperCase(), x + 5, cardY + 7);
    doc.setFontSize(card.label === "Clasificacion IMC" ? 9.5 : 14);
    doc.setTextColor(23, 32, 51);
    doc.text(String(card.value), x + 5, cardY + 16);
  });
}

function drawSectionTitle(doc, title, y) {
  doc.setFillColor(243, 247, 252);
  doc.roundedRect(14, y, 182, 9, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 91, 196);
  doc.text(title, 18, y + 6);
}

function drawKeyValueTable(doc, body, startY) {
  doc.autoTable({
    startY,
    body,
    theme: "grid",
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: [23, 32, 51],
      cellPadding: 3,
      lineColor: [219, 228, 240],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 52, fillColor: [248, 251, 255] },
      1: { cellWidth: 130 }
    },
    alternateRowStyles: {
      fillColor: [253, 254, 255]
    }
  });

  return doc.lastAutoTable.finalY + 6;
}

function drawZonesTable(doc, body, startY) {
  doc.autoTable({
    startY,
    head: [["Zona", "Rango"]],
    body,
    theme: "grid",
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [31, 91, 196],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: [23, 32, 51],
      cellPadding: 3,
      lineColor: [219, 228, 240],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 34, fontStyle: "bold" },
      1: { halign: "center", cellWidth: 148 }
    },
    alternateRowStyles: {
      fillColor: [248, 251, 255]
    }
  });

  return doc.lastAutoTable.finalY + 6;
}

export async function generateIndividualPDF(record) {
  const jsPDF = ensurePdfAvailability();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const formattedRecord = formatRecordForPDF(record);
  const logoDataUrl = await loadCircularHeaderLogo();

  drawHeader(doc, logoDataUrl);
  drawKpiCards(doc, record);

  let currentY = 70;
  drawSectionTitle(doc, "DATOS PERSONALES", currentY);
  currentY = drawKeyValueTable(doc, formattedRecord.personalData, currentY + 12);

  drawSectionTitle(doc, "RESULTADOS FISIOLOGICOS", currentY);
  currentY = drawKeyValueTable(doc, formattedRecord.physiologicalResults, currentY + 12);

  drawSectionTitle(doc, "ZONAS CARDIOVASCULARES", currentY);
  currentY = drawZonesTable(doc, formattedRecord.zones, currentY + 12);

  drawSectionTitle(doc, "DATOS DEL TEST FISICO", currentY);
  currentY = drawKeyValueTable(doc, formattedRecord.testData, currentY + 12);

  if (hasStrengthData(record)) {
    drawSectionTitle(doc, "DATOS DEL TEST DE FUERZA", currentY);
    drawKeyValueTable(doc, formattedRecord.strengthData, currentY + 12);
  }

  doc.save(buildPDFFileName(record));
  return doc;
}
