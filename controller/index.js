const axios = require('axios');

const { AQICN_TOKEN, STATION_ID } = process.env;

/**
 * Controller for fetching data from AQI API
 * GET /
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = async (req, res) => {
  try {
    const { data } = await axios.get(`https://api.waqi.info/feed/${STATION_ID}/`, {
      params: { token: AQICN_TOKEN },
    });

    return res.send(data);
  } catch (error) {
    console.error(error);

    return res.status(500).send("Error fetching data from API");
  }
};