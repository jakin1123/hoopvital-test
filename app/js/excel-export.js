const EXCEL_FILE_NAME = "evaluaciones_fisicas.xlsx";

const EXCEL_COLUMNS = [
  "Fecha Registro",
  "Nombre",
  "Edad",
  "Peso (kg)",
  "Altura (m)",
  "P1",
  "PM",
  "Zona A1 Min",
  "Zona A1 Max",
  "Zona A2 Min",
  "Zona A2 Max",
  "Zona A3 Min",
  "Zona A3 Max",
  "Zona A4 Min",
  "Zona A4 Max",
  "Zona A5 Min",
  "Zona A5 Max",
  "IMC",
  "Clasificación IMC",
  "Lugar Test",
  "Distancia (m)",
  "Pulso Inicio",
  "Tiempo Test",
  "Tiempo Segundos",
  "Pulso Final",
  "Pulso 1 Min",
  "Pulso 5 Min"
];

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "1F5BC4" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: createBorderStyle()
};

const BODY_STYLE = {
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: createBorderStyle()
};

function createBorderStyle() {
  return {
    top: { style: "thin", color: { rgb: "D7E0EC" } },
    bottom: { style: "thin", color: { rgb: "D7E0EC" } },
    left: { style: "thin", color: { rgb: "D7E0EC" } },
    right: { style: "thin", color: { rgb: "D7E0EC" } }
  };
}

function ensureXlsxAvailability() {
  if (!window.XLSX) {
    throw new Error("La libreria XLSX no esta disponible.");
  }

  return window.XLSX;
}

function formatRecordDate(value) {
  if (!value) {
    return "";
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

function calculateColumnWidth(rows, columnName) {
  const maxContentLength = rows.reduce((maxLength, row) => {
    const value = row[columnName] ?? "";
    return Math.max(maxLength, String(value).length);
  }, columnName.length);

  return Math.min(Math.max(maxContentLength + 3, 15), 30);
}

function applyWorksheetFormatting(worksheet, rows, XLSX) {
  worksheet["!cols"] = EXCEL_COLUMNS.map((columnName) => ({ wch: calculateColumnWidth(rows, columnName) }));
  worksheet["!rows"] = [{ hpt: 24 }];
  worksheet["!autofilter"] = { ref: worksheet["!ref"] };
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

  const range = worksheet["!ref"] ? XLSX.utils.decode_range(worksheet["!ref"]) : null;

  if (!range) {
    return;
  }

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[address];

      if (!cell) {
        continue;
      }

      if (rowIndex === 0) {
        cell.s = HEADER_STYLE;
        continue;
      }

      cell.s = {
        ...BODY_STYLE,
        fill: {
          fgColor: {
            rgb: rowIndex % 2 === 0 ? "F8FBFF" : "FFFFFF"
          }
        }
      };
    }
  }
}

export function buildExcelRow(record) {
  return {
    "Fecha Registro": formatRecordDate(record.createdAt),
    "Nombre": record.nombre ?? "",
    "Edad": record.edad ?? "",
    "Peso (kg)": record.peso ?? "",
    "Altura (m)": record.altura ?? "",
    "P1": record.p1 ?? "",
    "PM": record.pm ?? "",
    "Zona A1 Min": record.zonaA1Min ?? "",
    "Zona A1 Max": record.zonaA1Max ?? "",
    "Zona A2 Min": record.zonaA2Min ?? "",
    "Zona A2 Max": record.zonaA2Max ?? "",
    "Zona A3 Min": record.zonaA3Min ?? "",
    "Zona A3 Max": record.zonaA3Max ?? "",
    "Zona A4 Min": record.zonaA4Min ?? "",
    "Zona A4 Max": record.zonaA4Max ?? "",
    "Zona A5 Min": record.zonaA5Min ?? "",
    "Zona A5 Max": record.zonaA5Max ?? "",
    "IMC": record.imc ?? "",
    "Clasificación IMC": record.clasificacionIMC ?? "",
    "Lugar Test": record.testLugar ?? "",
    "Distancia (m)": record.testDistanciaMetros ?? "",
    "Pulso Inicio": record.testPulsoInicio ?? "",
    "Tiempo Test": record.testTiempoTexto ?? "",
    "Tiempo Segundos": record.testTiempoSegundos ?? "",
    "Pulso Final": record.testPulsoFinal ?? "",
    "Pulso 1 Min": record.testPulso1Min ?? "",
    "Pulso 5 Min": record.testPulso5Min ?? ""
  };
}

export function addRecord(records, record) {
  const nextRecord = JSON.parse(JSON.stringify(record));
  records.push(nextRecord);
  return nextRecord;
}

export function downloadWorkbook(workbook, fileName = EXCEL_FILE_NAME) {
  const XLSX = ensureXlsxAvailability();
  XLSX.writeFile(workbook, fileName, { cellStyles: true });
}

export function exportToExcel(records, fileName = EXCEL_FILE_NAME) {
  const XLSX = ensureXlsxAvailability();
  const rows = records.map(buildExcelRow);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXCEL_COLUMNS });
  const workbook = XLSX.utils.book_new();

  applyWorksheetFormatting(worksheet, rows, XLSX);
  workbook.Props = {
    Title: "Evaluaciones Fisicas",
    Subject: "Reporte de evaluaciones",
    Author: "Fitness App",
    CreatedDate: new Date()
  };
  XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluaciones");
  downloadWorkbook(workbook, fileName);

  return workbook;
}

export function getExcelFileName() {
  return EXCEL_FILE_NAME;
}
