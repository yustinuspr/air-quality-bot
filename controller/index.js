const aqiCnService = require('../services/aqicn');
const iqAirService = require('../services/iqair');

/**
 * Controller to reply with the current AQI data
 * @param {import('grammy').Context} ctx
 * @returns {Promise<*>}
 */
module.exports = async (ctx) => {
  try {
    const text = ctx.message.text.replaceAll('/', '');

    const [aqiCnData, iqAirData] = await Promise.allSettled([
      aqiCnService.getAirQuality(text),
      iqAirService.getAirQuality(text),
    ]);

    const replies = [];

    if (aqiCnData?.value) {
      const aqiCnWording = aqiCnService.parseWordingAqiCn(aqiCnData.value);

      replies.push(aqiCnWording);
    }

    if (iqAirData?.value) {
      const iqAirWording = iqAirService.parseWordingIqAir(iqAirData.value);

      replies.push(iqAirWording);
    }

    const wording = replies.join('\n\n');

    return ctx.reply(wording, { parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);

    return ctx.reply("Error fetching data from API");
  }
};