const STORAGE_KEY = "fitness_app_records";
const JSON_FILE_NAME = "respaldo_evaluaciones_fisicas.json";

function isRecordLike(value) {
  return Boolean(value && typeof value === "object" && typeof value.id === "string");
}

function dedupeRecords(records) {
  const map = new Map();

  records.forEach((record) => {
    if (!isRecordLike(record)) {
      return;
    }

    map.set(record.id, { ...record });
  });

  return Array.from(map.values());
}

function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No fue posible leer el archivo JSON."));
    reader.readAsText(file);
  });
}

function downloadTextFile(fileName, textContent, mimeType) {
  const blob = new Blob([textContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export function loadRecords() {
  const storedValue = readStorage();

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? dedupeRecords(parsedValue) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  const normalizedRecords = dedupeRecords(Array.isArray(records) ? records : []);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedRecords));
  return normalizedRecords;
}

export function addRecord(record) {
  const records = loadRecords();
  const updatedRecords = [...records, JSON.parse(JSON.stringify(record))];
  return saveRecords(updatedRecords);
}

export function updateRecord(id, updatedData) {
  const records = loadRecords();
  const updatedRecords = records.map((record) => {
    if (record.id !== id) {
      return record;
    }

    return { ...record, ...JSON.parse(JSON.stringify(updatedData)), id: record.id };
  });

  return saveRecords(updatedRecords);
}

export function deleteRecord(id) {
  const records = loadRecords();
  return saveRecords(records.filter((record) => record.id !== id));
}

export function clearAllRecords() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}

export function exportJSON(records = loadRecords()) {
  const normalizedRecords = dedupeRecords(Array.isArray(records) ? records : []);
  downloadTextFile(JSON_FILE_NAME, JSON.stringify(normalizedRecords, null, 2), "application/json");
  return normalizedRecords;
}

export async function importJSON(file) {
  if (!file) {
    throw new Error("Selecciona un archivo JSON valido.");
  }

  const content = await readFileAsText(file);
  let parsedContent;

  try {
    parsedContent = JSON.parse(content);
  } catch {
    throw new Error("El archivo seleccionado no contiene un JSON valido.");
  }

  if (!Array.isArray(parsedContent)) {
    throw new Error("El archivo JSON debe contener un arreglo de registros.");
  }

  const importedRecords = dedupeRecords(parsedContent);

  if (!importedRecords.length && parsedContent.length) {
    throw new Error("El archivo JSON no contiene registros con estructura valida.");
  }

  const existingRecords = loadRecords();
  const mergedRecords = dedupeRecords([...existingRecords, ...importedRecords]);

  return saveRecords(mergedRecords);
}

export function getStorageKey() {
  return STORAGE_KEY;
}
