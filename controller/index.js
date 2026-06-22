const axios = require('axios');

const { AQICN_TOKEN, STATION_ID } = process.env;

const aqiHelpers = require('../helpers/aqi');

/**
 * Controller to reply with the current AQI data
 * @param {import('grammy').Context} ctx
 * @returns {Promise<*>}
 */
module.exports = async (ctx) => {
  try {
    const { data } = await axios.get(`https://api.waqi.info/feed/${STATION_ID}/`, {
      params: { token: AQICN_TOKEN },
    });

    const { aqi, iaqi, city } = data.data;

    const aqiLabel = aqiHelpers.transformAqiToLabel(aqi);

    const stationName = city.name;
    const humidityLevel = iaqi?.h?.v;
    const temperatureLevel = iaqi?.t?.v;

    const pm1Level = iaqi?.pm1?.v;
    const pm1Label = aqiHelpers.transformAqiToLabel(pm1Level);

    const pm10Level = iaqi?.pm10?.v;
    const pm10Label = aqiHelpers.transformAqiToLabel(pm10Level);

    const pm25Level = iaqi?.pm25?.v;
    const pm25Label = aqiHelpers.transformAqiToLabel(pm25Level);

    const wording = `Data from <b>${stationName}</b>>\n`
    + `Current AQI: ${aqi} (<b>${aqiLabel}</b>)\n`
    + `Humidity: ${humidityLevel}%\n`
    + `Temperature: ${temperatureLevel}°C\n`
    + `PM1: ${pm1Level} (<b>${pm1Label}</b>)\n`
    + `PM10: ${pm10Level} (<b>${pm10Label}</b>)\n`
    + `PM2.5: ${pm25Level} (<b>${pm25Label}</b>)\n`

    return ctx.reply(wording, { parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);

    return ctx.reply("Error fetching data from API");
  }
};