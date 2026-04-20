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
    case "testPulseStart":
    case "testPulseEnd":
    case "testPulse1Min":
    case "testPulse5Min":
      return sanitizeNumericInput(value, { allowDecimal: false });
    case "weight":
    case "height":
    case "testDistance":
      return sanitizeNumericInput(value, { allowDecimal: true });
    case "testTime":
      return value.replace(/[^0-9:'"msin eg]/gi, "").replace(/\s+/g, " ").trimStart();
    default:
      return value.replace(/\s+/g, " ").trimStart();
  }
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
    testPulseStart: validateTestPulseStart(fields.testPulseStart),
    testTime: validateTestTime(fields.testTime),
    testPulseEnd: validateTestPulseEnd(fields.testPulseEnd),
    testPulse1Min: validateTestPulse1Min(fields.testPulse1Min),
    testPulse5Min: validateTestPulse5Min(fields.testPulse5Min)
  };

  validation.testLocation = validateTestLocation(fields.testLocation, fields);

  return validation;
}
