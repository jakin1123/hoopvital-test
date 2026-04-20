export const ZONE_CONFIG = [
  { key: "A5", label: "Zona A5", minIntensity: 0.8, maxIntensity: 1, rowClass: "zone-a5" },
  { key: "A4", label: "Zona A4", minIntensity: 0.7, maxIntensity: 0.8, rowClass: "zone-a4" },
  { key: "A3", label: "Zona A3", minIntensity: 0.6, maxIntensity: 0.7, rowClass: "zone-a3" },
  { key: "A2", label: "Zona A2", minIntensity: 0.5, maxIntensity: 0.6, rowClass: "zone-a2" },
  { key: "A1", label: "Zona A1", minIntensity: 0.3, maxIntensity: 0.5, rowClass: "zone-a1" }
];

export const BMI_RANGES = [
  { min: 0, max: 15.99, label: "Delgadez muy severa" },
  { min: 16.0, max: 16.9, label: "Delgadez severa" },
  { min: 17.0, max: 18.4, label: "Delgadez" },
  { min: 18.5, max: 24.9, label: "Peso saludable" },
  { min: 25.0, max: 29.9, label: "Sobrepeso" },
  { min: 30.0, max: 34.9, label: "Obesidad" },
  { min: 35.0, max: 39.9, label: "Obesidad severa" },
  { min: 40.0, max: Number.POSITIVE_INFINITY, label: "Obesidad" }
];

function roundPulse(value) {
  return Math.round(value);
}

export function calculateMaxHeartRate(age) {
  if (!Number.isInteger(age) || age < 1) {
    return null;
  }

  return 220 - age;
}

export function calculateHeartRateReserve(pm, p1, intensity) {
  if (!Number.isFinite(pm) || !Number.isFinite(p1) || !Number.isFinite(intensity)) {
    return null;
  }

  return roundPulse(((pm - p1) * intensity) + p1);
}

export function calculateTrainingZones(pm, p1) {
  if (!Number.isFinite(pm) || !Number.isFinite(p1)) {
    return [];
  }

  const thresholds = {
    0.3: calculateHeartRateReserve(pm, p1, 0.3),
    0.5: calculateHeartRateReserve(pm, p1, 0.5),
    0.6: calculateHeartRateReserve(pm, p1, 0.6),
    0.7: calculateHeartRateReserve(pm, p1, 0.7),
    0.8: calculateHeartRateReserve(pm, p1, 0.8)
  };

  return [
    { key: "A5", label: "Zona A5", min: thresholds[0.8], max: pm, rowClass: "zone-a5" },
    { key: "A4", label: "Zona A4", min: thresholds[0.7], max: thresholds[0.8] - 1, rowClass: "zone-a4" },
    { key: "A3", label: "Zona A3", min: thresholds[0.6], max: thresholds[0.7] - 1, rowClass: "zone-a3" },
    { key: "A2", label: "Zona A2", min: thresholds[0.5], max: thresholds[0.6] - 1, rowClass: "zone-a2" },
    { key: "A1", label: "Zona A1", min: thresholds[0.3], max: thresholds[0.5] - 1, rowClass: "zone-a1" }
  ];
}

export function calculateBMI(weight, height) {
  if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return weight / (height * height);
}

export function formatBMI(bmi) {
  if (!Number.isFinite(bmi)) {
    return "--";
  }

  return bmi.toFixed(2);
}

export function classifyBMI(bmi) {
  if (!Number.isFinite(bmi)) {
    return null;
  }

  return BMI_RANGES.find((range) => bmi >= range.min && bmi <= range.max) ?? null;
}

export function formatRangeLabel(range) {
  if (!range) {
    return "--";
  }

  if (!Number.isFinite(range.max)) {
    return `>= ${range.min.toFixed(1)}`;
  }

  return `${range.min.toFixed(1)} - ${range.max.toFixed(1)}`;
}

export function parseTestTimeToSeconds(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "") {
    return null;
  }

  const compactValue = normalized.replace(/\s+/g, " ");
  const patterns = [
    /^(\d{1,3})[:'](\d{1,2})"?$/,
    /^(\d{1,3})m\s*(\d{1,2})s$/,
    /^(\d{1,3})\s*min\s*(\d{1,2})\s*seg$/
  ];

  for (const pattern of patterns) {
    const match = compactValue.match(pattern);

    if (!match) {
      continue;
    }

    const minutes = Number.parseInt(match[1], 10);
    const seconds = Number.parseInt(match[2], 10);

    if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || seconds > 59) {
      return null;
    }

    return (minutes * 60) + seconds;
  }

  return null;
}
