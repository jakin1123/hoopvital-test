import { calculateBMI, calculateMaxHeartRate, calculateTrainingZones, classifyBMI, formatBMI } from "./calculations.js";

function generateRecordId() {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `rec-${stamp}-${random}`;
}

function mapZonesToRecordFields(record, zones) {
  const zoneMap = Object.fromEntries(zones.map((zone) => [zone.key, zone]));

  ["A1", "A2", "A3", "A4", "A5"].forEach((zoneKey) => {
    const zone = zoneMap[zoneKey];
    record[`zona${zoneKey}Min`] = zone?.min ?? null;
    record[`zona${zoneKey}Max`] = zone?.max ?? null;
  });
}

export function createEmptyRecord() {
  return {
    id: generateRecordId(),
    nombre: "",
    edad: null,
    peso: null,
    altura: null,
    p1: 60,
    pm: null,
    zonaA1Min: null,
    zonaA1Max: null,
    zonaA2Min: null,
    zonaA2Max: null,
    zonaA3Min: null,
    zonaA3Max: null,
    zonaA4Min: null,
    zonaA4Max: null,
    zonaA5Min: null,
    zonaA5Max: null,
    imc: null,
    clasificacionIMC: "",
    testLugar: "",
    testDistanciaMetros: null,
    testPulsoInicio: null,
    testTiempoTexto: "",
    testTiempoSegundos: null,
    testPulsoFinal: null,
    testPulso1Min: null,
    testPulso5Min: null,
    createdAt: new Date().toISOString()
  };
}

export function buildRecordFromState(formState) {
  const record = createEmptyRecord();
  const age = formState.values.age;
  const weight = formState.values.weight;
  const height = formState.values.height;
  const p1 = formState.values.p1;
  const pm = calculateMaxHeartRate(age);
  const zones = calculateTrainingZones(pm, p1);
  const bmi = calculateBMI(weight, height);
  const bmiRange = classifyBMI(bmi);

  record.nombre = formState.values.name ?? "";
  record.edad = age;
  record.peso = weight;
  record.altura = height;
  record.p1 = p1;
  record.pm = pm;
  record.imc = bmi !== null ? Number(formatBMI(bmi)) : null;
  record.clasificacionIMC = bmiRange?.label ?? "";
  record.testLugar = formState.values.testLocation ?? "";
  record.testDistanciaMetros = formState.values.testDistance;
  record.testPulsoInicio = formState.values.testPulseStart;
  record.testTiempoTexto = formState.values.testTimeText ?? "";
  record.testTiempoSegundos = formState.values.testTimeSeconds;
  record.testPulsoFinal = formState.values.testPulseEnd;
  record.testPulso1Min = formState.values.testPulse1Min;
  record.testPulso5Min = formState.values.testPulse5Min;

  mapZonesToRecordFields(record, zones);

  return record;
}

export function getSerializableFormSnapshot(formState) {
  return {
    values: { ...formState.values },
    computed: { ...formState.computed },
    validation: Object.fromEntries(
      Object.entries(formState.validation).map(([key, value]) => [key, { isValid: value.isValid, message: value.message }])
    )
  };
}

export function prepareExportPayload(formState) {
  const record = buildRecordFromState(formState);

  return {
    record,
    exportRow: createExportRow(record),
    snapshot: getSerializableFormSnapshot(formState)
  };
}

export function createExportRow(record) {
  return {
    nombre: record.nombre,
    edad: record.edad,
    pesoKg: record.peso,
    alturaM: record.altura,
    p1: record.p1,
    pm: record.pm,
    zonaA1: formatZoneCell(record.zonaA1Min, record.zonaA1Max),
    zonaA2: formatZoneCell(record.zonaA2Min, record.zonaA2Max),
    zonaA3: formatZoneCell(record.zonaA3Min, record.zonaA3Max),
    zonaA4: formatZoneCell(record.zonaA4Min, record.zonaA4Max),
    zonaA5: formatZoneCell(record.zonaA5Min, record.zonaA5Max),
    imc: record.imc,
    clasificacionIMC: record.clasificacionIMC,
    lugarTest: record.testLugar,
    distanciaMetros: record.testDistanciaMetros,
    pulsoInicio: record.testPulsoInicio,
    tiempoTest: record.testTiempoTexto,
    tiempoSegundos: record.testTiempoSegundos,
    pulsoFinal: record.testPulsoFinal,
    pulso1Min: record.testPulso1Min,
    pulso5Min: record.testPulso5Min,
    fechaRegistro: record.createdAt
  };
}

function formatZoneCell(min, max) {
  if (min === null || max === null) {
    return "";
  }

  return `${min}-${max}`;
}

export function getFuturePersistenceHooks() {
  return {
    // Puntos de extension para historial y exportacion futura.
    saveRecord: null,
    listRecords: null,
    updateRecord: null,
    deleteRecord: null,
    exportToCsv: null,
    exportToXlsx: null
  };
}
