import { parseTestTimeToSeconds } from "./calculations.js";

function sanitizeNumericInput(value, { allowDecimal = false } = {}) {
  const normalized = value.replace(",", ".");
  const pattern = allowDecimal ? /[^0-9.]/g : /\D/g;
  const cleaned = normalized.replace(pattern, "");

  if (!allowDecimal) {
    return cleaned;
  }

  const [integerPart, ...decimalParts] = cleaned.split(".");
  return decimalParts.length ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

function parseOptionalInteger(value) {
  if (value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseOptionalFloat(value) {
  if (value === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeFieldValue(fieldName, value) {
  switch (fieldName) {
    case "age":
    case "p1":
    case "testStops":
    case "strengthPushUpsReps":
    case "strengthAbsReps":
    case "testPulseStart":
    case "testPulseEnd":
    case "testPulse1Min":
    case "testPulse5Min":
      return sanitizeNumericInput(value, { allowDecimal: false });
    case "weight":
    case "height":
    case "testDistance":
    case "strengthStandingLongJump":
    case "strengthSpeed14m":
    case "strengthZoneDisplacement":
    case "strengthVerticalJump":
      return sanitizeNumericInput(value, { allowDecimal: true });
    case "testTime":
    case "strengthPushUpsTime":
    case "strengthAbsTime":
      return value.replace(/[^0-9:'"msin eg]/gi, "").replace(/\s+/g, " ").trimStart();
    default:
      return value.replace(/\s+/g, " ").trimStart();
  }
}

function validateOptionalIntegerInRange(value, fieldLabel, min, max) {
  const parsed = parseOptionalInteger(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || String(parsed) !== value) {
    return { isValid: false, message: `${fieldLabel} debe ser un numero entero valido.`, parsedValue: null };
  }

  if (parsed < min || parsed > max) {
    return { isValid: false, message: `${fieldLabel} debe estar entre ${min} y ${max}.`, parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

function validateOptionalPositiveFloat(value, fieldLabel) {
  const parsed = parseOptionalFloat(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || parsed <= 0) {
    return { isValid: false, message: `${fieldLabel} debe ser un valor decimal positivo.`, parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

function validateOptionalTime(value, exampleLabel) {
  if (value === "") {
    return { isValid: true, message: "", parsedValue: "", seconds: null };
  }

  const seconds = parseTestTimeToSeconds(value);

  if (seconds === null) {
    return {
      isValid: false,
      message: `Usa un formato valido para ${exampleLabel}, por ejemplo 0:57, 57 o 57s.`,
      parsedValue: value,
      seconds: null
    };
  }

  return { isValid: true, message: "", parsedValue: value, seconds };
}

function validatePulse(value, fieldLabel) {
  const parsed = parseOptionalInteger(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || String(parsed) !== value) {
    return { isValid: false, message: `${fieldLabel} debe ser un numero entero valido.`, parsedValue: null };
  }

  if (parsed < 30 || parsed > 250) {
    return { isValid: false, message: `${fieldLabel} debe estar entre 30 y 250.`, parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateName(value) {
  if (value.trim() === "") {
    return { isValid: true, message: "" };
  }

  return { isValid: true, message: "" };
}

export function validateAge(value) {
  const parsed = parseOptionalInteger(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || String(parsed) !== value) {
    return { isValid: false, message: "Ingresa una edad entera valida.", parsedValue: null };
  }

  if (parsed < 1 || parsed > 120) {
    return { isValid: false, message: "La edad debe estar entre 1 y 120.", parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateWeight(value) {
  const parsed = parseOptionalFloat(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || parsed <= 0) {
    return { isValid: false, message: "Ingresa un peso positivo.", parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateHeight(value) {
  const parsed = parseOptionalFloat(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || parsed <= 0) {
    return { isValid: false, message: "Ingresa una altura positiva en metros.", parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateP1(value) {
  const parsed = parseOptionalInteger(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || String(parsed) !== value) {
    return { isValid: false, message: "P1 debe ser un numero entero valido.", parsedValue: null };
  }

  if (parsed < 30 || parsed > 130) {
    return { isValid: false, message: "P1 debe estar entre 30 y 130 ppm.", parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateTestLocation(value, allFields) {
  const hasAnyTestField = [
    allFields.testDistance,
    allFields.testStops,
    allFields.testPulseStart,
    allFields.testTime,
    allFields.testPulseEnd,
    allFields.testPulse1Min,
    allFields.testPulse5Min
  ].some((fieldValue) => String(fieldValue ?? "").trim() !== "");

  if (value.trim() === "") {
    if (hasAnyTestField) {
      return { isValid: false, message: "Indica el lugar del test para completar este bloque.", parsedValue: "" };
    }

    return { isValid: true, message: "", parsedValue: "" };
  }

  return { isValid: true, message: "", parsedValue: value.trim() };
}

export function validateTestDistance(value) {
  const parsed = parseOptionalFloat(value);

  if (value === "") {
    return { isValid: true, message: "", parsedValue: null };
  }

  if (parsed === null || parsed <= 0) {
    return { isValid: false, message: "Ingresa una distancia positiva en metros.", parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateTestTime(value) {
  if (value === "") {
    return { isValid: true, message: "", parsedValue: "", seconds: null };
  }

  const seconds = parseTestTimeToSeconds(value);

  if (seconds === null) {
    return {
      isValid: false,
      message: "Usa un formato valido, por ejemplo 17'33\", 17:33 o 17m 33s.",
      parsedValue: value,
      seconds: null
    };
  }

  return { isValid: true, message: "", parsedValue: value, seconds };
}

export function validateTestStops(value) {
  const parsed = parseOptionalInteger(value);

  if (value === "") {
    return { isValid: false, message: "Ingresa cuantas veces se detuvo el atleta durante el test.", parsedValue: null };
  }

  if (parsed === null || String(parsed) !== value) {
    return { isValid: false, message: "Las detenciones deben ser un numero entero valido.", parsedValue: null };
  }

  if (parsed < 0 || parsed > 99) {
    return { isValid: false, message: "Las detenciones deben estar entre 0 y 99.", parsedValue: null };
  }

  return { isValid: true, message: "", parsedValue: parsed };
}

export function validateStrengthPushUpsReps(value) {
  return validateOptionalIntegerInRange(value, "Las flexiones de codo", 0, 300);
}

export function validateStrengthPushUpsTime(value) {
  return validateOptionalTime(value, "el tiempo de flexiones");
}

export function validateStrengthPushUpsObservations(value) {
  if (value.length > 500) {
    return { isValid: false, message: "Las observaciones no deben superar los 500 caracteres.", parsedValue: value.slice(0, 500) };
  }

  return { isValid: true, message: "", parsedValue: value.trim() };
}

export function validateStrengthAbsReps(value) {
  return validateOptionalIntegerInRange(value, "Los abdominales", 0, 500);
}

export function validateStrengthAbsTime(value) {
  return validateOptionalTime(value, "el tiempo de abdominales");
}

export function validateStrengthStandingLongJump(value) {
  return validateOptionalPositiveFloat(value, "El salto sin impulso");
}

export function validateStrengthSpeed14m(value) {
  return validateOptionalPositiveFloat(value, "La velocidad de 14 m");
}

export function validateStrengthZoneDisplacement(value) {
  return validateOptionalPositiveFloat(value, "El desplazamiento por zona");
}

export function validateStrengthVerticalJump(value) {
  return validateOptionalPositiveFloat(value, "El salto vertical");
}

export function validateTestPulseStart(value) {
  return validatePulse(value, "El pulso de inicio");
}

export function validateTestPulseEnd(value) {
  return validatePulse(value, "El pulso final");
}

export function validateTestPulse1Min(value) {
  return validatePulse(value, "El pulso despues de 1 minuto");
}

export function validateTestPulse5Min(value) {
  return validatePulse(value, "El pulso despues de 5 minutos");
}

export function validateForm(fields) {
  const validation = {
    name: validateName(fields.name),
    age: validateAge(fields.age),
    weight: validateWeight(fields.weight),
    height: validateHeight(fields.height),
    p1: validateP1(fields.p1),
    testDistance: validateTestDistance(fields.testDistance),
    testStops: validateTestStops(fields.testStops),
    testPulseStart: validateTestPulseStart(fields.testPulseStart),
    testTime: validateTestTime(fields.testTime),
    testPulseEnd: validateTestPulseEnd(fields.testPulseEnd),
    testPulse1Min: validateTestPulse1Min(fields.testPulse1Min),
    testPulse5Min: validateTestPulse5Min(fields.testPulse5Min),
    strengthPushUpsReps: validateStrengthPushUpsReps(fields.strengthPushUpsReps),
    strengthPushUpsTime: validateStrengthPushUpsTime(fields.strengthPushUpsTime),
    strengthPushUpsObservations: validateStrengthPushUpsObservations(fields.strengthPushUpsObservations),
    strengthAbsReps: validateStrengthAbsReps(fields.strengthAbsReps),
    strengthAbsTime: validateStrengthAbsTime(fields.strengthAbsTime),
    strengthStandingLongJump: validateStrengthStandingLongJump(fields.strengthStandingLongJump),
    strengthSpeed14m: validateStrengthSpeed14m(fields.strengthSpeed14m),
    strengthZoneDisplacement: validateStrengthZoneDisplacement(fields.strengthZoneDisplacement),
    strengthVerticalJump: validateStrengthVerticalJump(fields.strengthVerticalJump)
  };

  validation.testLocation = validateTestLocation(fields.testLocation, fields);

  return validation;
}
