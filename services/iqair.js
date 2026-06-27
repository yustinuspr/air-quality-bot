const axios = require('axios');

const aqiHelpers = require('../helpers/aqi');

const { CACHE_AGE_IN_MS } = require('../constants/cache');

const { IQAIR_TOKEN, IQAIR_MAPPING } = process.env;

let iqAirMapping;

try {
  iqAirMapping = JSON.parse(IQAIR_MAPPING);
} catch (e) {
  console.error('Error parsing IQAIR_MAPPING', e);
}

const iqAirResult = {};

/**
 * Get Air Quality Index from IQAIR API
 *
 * @param {string} city
 * @returns {Promise<{city: string, aqiLevel: number, aqiLabel: string, humidityLevel: number, temperatureLevel: number, heatIndexLevel: number}|null>}
 */
exports.getAirQuality = async (city) => {
  if (!iqAirMapping) {
    console.error('IQAIR_MAPPING is not set');

    return null;
  }

  const cityMapping = iqAirMapping[city?.toLowerCase()];

  if (!cityMapping) {
    console.error(`City not found for ${city}`);

    return null;
  }

  if (iqAirResult[cityMapping.city]) {
    return iqAirResult[cityMapping.city];
  }

  try {
    const {data} = await axios.get(
      'http://api.airvisual.com/v2/city',
      {
        params: {
          key: IQAIR_TOKEN,
          city: cityMapping.city,
          state: cityMapping.state,
          country: cityMapping.country
        }
      }
    );

    const { current, city: cityResponse } = data?.data || {};
    const { pollution, weather } = current || {};

    const aqiLevel = pollution?.aqius;
    const aqiLabel = aqiHelpers.transformAqiToLabel(aqiLevel);

    const humidityLevel = weather?.hu;
    const temperatureLevel = weather?.tp;
    const heatIndexLevel = weather?.heatIndex;

    const result = {
      aqiLevel,
      aqiLabel,
      city: cityResponse,
      humidityLevel,
      temperatureLevel,
      heatIndexLevel,
    };

    // Set cache for future use.
    // This being done to reduce the number of API calls.
    // We use in memory cache instead of Redis because the key size is small.
    iqAirResult[cityMapping.city] = result;

    setTimeout(() => {
        // Clear cache after it met cache age
        iqAirResult[cityMapping.city] = null;
      },
      CACHE_AGE_IN_MS,
    )

    return result;
  } catch (err) {
    console.error('Error fetching AQI data from IQAIR', err?.response?.data || err);

    return null;
  }
}

/**
 *
 * @param {{city: string, aqiLevel: number, aqiLabel: string, humidityLevel: number, temperatureLevel: number, heatIndexLevel: number}} data
 * @returns {string}
 */
exports.parseWordingIqAir = (data) => {
  const { aqiLevel, aqiLabel, city, humidityLevel, temperatureLevel, heatIndexLevel } = data;

  const iqAirWording = [
    `<b>[IQAIR]</b> Data from <b>${city}</b>`,
  `Current AQI: ${aqiLevel} (<b>${aqiLabel}</b>)`,
  humidityLevel ? `Humidity: ${humidityLevel}%` : null,
  temperatureLevel ? `Temperature: ${temperatureLevel}°C` : null,
  heatIndexLevel ? `Feels Like: ${heatIndexLevel}°C` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return iqAirWording;
}

