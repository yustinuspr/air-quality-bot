const axios = require('axios');

const aqiHelpers = require('../helpers/aqi');

const { CACHE_AGE_IN_MS } = require('../constants/cache');

const { AQICN_TOKEN, AQICN_MAPPING } = process.env;

let aqiCnMapping;

try {
  aqiCnMapping = JSON.parse(AQICN_MAPPING);
} catch (e) {
  console.error('Error parsing AQICN_MAPPING', e);
}

const aqiCnResult = {};

/**
 * Get Air Quality Index from AQICN API
 *
 * @param {string} city
 * @returns {Promise<{aqi: number, iaqi: number, stationName: string, humidityLevel: number, temperatureLevel: number, pm1Level: number, pm1Label: string, pm10Level: number, pm10Label: string, pm25Level: number, pm25Label: string}|null>}
 */
exports.getAirQuality = async (city) => {
  if (!aqiCnMapping) {
    console.error('AQICN_MAPPING is not set');

    return null;
  }

  const stationId = aqiCnMapping[city?.toLowerCase()];

  if (!stationId) {
    console.error(`Station not found for ${city}`);

    return null;
  }

  if (aqiCnResult[stationId]) {
    // If cache exists, return it immediately from the cache.
    return aqiCnResult[stationId];
  }

  try {
    const { data } = await axios.get(`https://api.waqi.info/feed/${stationId}/`, {
      params: { token: AQICN_TOKEN },
    });

    const { aqi, iaqi, city: cityData } = data.data;

    const aqiLabel = aqiHelpers.transformAqiToLabel(aqi);

    const stationName = cityData.name;
    const humidityLevel = iaqi?.h?.v;
    const temperatureLevel = iaqi?.t?.v;

    const pm1Level = iaqi?.pm1?.v;
    const pm1Label = aqiHelpers.transformAqiToLabel(pm1Level);

    const pm10Level = iaqi?.pm10?.v;
    const pm10Label = aqiHelpers.transformAqiToLabel(pm10Level);

    const pm25Level = iaqi?.pm25?.v;
    const pm25Label = aqiHelpers.transformAqiToLabel(pm25Level);

    const result = {
      aqi,
      aqiLabel,
      iaqi,
      stationName,
      humidityLevel,
      temperatureLevel,
      pm1Level,
      pm1Label,
      pm10Level,
      pm10Label,
      pm25Level,
      pm25Label,
    };

    // Set cache for future use.
    // This being done to reduce the number of API calls.
    aqiCnResult[stationId] = result;

    setTimeout(() => {
        // Clear cache after it met cache age
        aqiCnResult[stationId] = null;
      },
      CACHE_AGE_IN_MS,
    );

    return result;
  } catch (err) {
    console.error('Error fetching AQI data from AQICN', err?.response?.data || err);

    return null;
  }
}

/**
 * Parse AQI data to wording
 * 
 * @param {{aqi: number, iaqi: number, stationName: string, humidityLevel: number, temperatureLevel: number, pm1Level: number, pm1Label: string, pm10Level: number, pm10Label: string, pm25Level: number, pm25Label: string}} data
 * @returns {string}
 */
exports.parseWordingAqiCn = (data) => {
  const { stationName, aqi, aqiLabel, humidityLevel, temperatureLevel, pm1Level, pm1Label, pm10Level, pm10Label, pm25Level, pm25Label } = data;

  const aqiCnWording = [
    `<b>[AQICN]</b> Data from <b>${stationName}</b>`,
    `Current AQI: ${aqi} (<b>${aqiLabel}</b>)`,
    humidityLevel ? `Humidity: ${humidityLevel}%` : null,
    temperatureLevel ? `Temperature: ${temperatureLevel}°C` : null,
    pm1Level ? `PM1: ${pm1Level} (<b>${pm1Label}</b>)` : null,
    pm10Level ? `PM10: ${pm10Level} (<b>${pm10Label}</b>)` : null,
    pm25Level ? `PM2.5: ${pm25Level} (<b>${pm25Label}</b>)` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return aqiCnWording;
}