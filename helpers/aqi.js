const { AQI_LABELS } = require('../constants/aqi');

exports.transformAqiToLabel = (aqi) => {
  if (aqi <= 50) return AQI_LABELS.GOOD;
  if (aqi <= 100) return AQI_LABELS.MODERATE;
  if (aqi <= 150) return AQI_LABELS.UNHEALTHY_FOR_SENSITIVE_GROUPS;
  if (aqi <= 200) return AQI_LABELS.UNHEALTHY;
  if (aqi <= 300) return AQI_LABELS.VERY_UNHEALTHY;
  return AQI_LABELS.HAZARDOUS;
}