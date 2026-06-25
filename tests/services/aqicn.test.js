jest.mock('axios');
jest.mock('../../helpers/aqi');

describe('AQICN service', () => {
  const ORIGINAL_ENV = process.env;

  let axios;
  let aqiHelpers;
  let service;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };

    // Re-require after resetModules so all references share the same module instances
    axios = require('axios');
    aqiHelpers = require('../../helpers/aqi');
    service = require('../../services/aqicn');
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  // --- getAirQuality ---

  describe('getAirQuality', () => {
    it('returns null and logs error when AQICN_MAPPING is not set', async () => {
      process.env.AQICN_MAPPING = undefined;
      jest.resetModules();
      const freshService = require('../../services/aqicn');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await freshService.getAirQuality('jakarta');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('AQICN_MAPPING is not set');
      consoleSpy.mockRestore();
    });

    it('returns null and logs error when city is not in mapping', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAirQuality('unknown-city');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Station not found for unknown-city');
      consoleSpy.mockRestore();
    });

    it('returns null when city is undefined', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAirQuality(undefined);

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('performs a case-insensitive city lookup', async () => {
      aqiHelpers.transformAqiToLabel.mockReturnValue('Good');
      axios.get.mockResolvedValue({
        data: {
          data: {
            aqi: 42,
            iaqi: { h: { v: 60 }, t: { v: 28 } },
            city: { name: 'Jakarta Station' },
          },
        },
      });

      const result = await service.getAirQuality('city-123');

      expect(result).not.toBeNull();
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.waqi.info/feed/station-123/',
        { params: { token: 'test-token' } }
      );
    });

    it('returns the correct AQI data shape on a successful API call', async () => {
      aqiHelpers.transformAqiToLabel
        .mockReturnValueOnce('Good')      // for aqi
        .mockReturnValueOnce('Good')      // for pm1
        .mockReturnValueOnce('Moderate')  // for pm10
        .mockReturnValueOnce('Good');     // for pm25

      const mockIaqi = {
        h: { v: 65 },
        t: { v: 30 },
        pm1: { v: 10 },
        pm10: { v: 80 },
        pm25: { v: 45 },
      };

      axios.get.mockResolvedValue({
        data: {
          data: {
            aqi: 42,
            iaqi: mockIaqi,
            city: { name: 'Jakarta Station' },
          },
        },
      });

      const result = await service.getAirQuality('city-123');

      expect(result).toEqual({
        aqi: 42,
        aqiLabel: 'Good',
        iaqi: mockIaqi,
        stationName: 'Jakarta Station',
        humidityLevel: 65,
        temperatureLevel: 30,
        pm1Level: 10,
        pm1Label: 'Good',
        pm10Level: 80,
        pm10Label: 'Moderate',
        pm25Level: 45,
        pm25Label: 'Good',
      });
    });

    it('returns correct data when optional iaqi fields are missing', async () => {
      aqiHelpers.transformAqiToLabel.mockReturnValue('Good');

      axios.get.mockResolvedValue({
        data: {
          data: {
            aqi: 20,
            iaqi: {},
            city: { name: 'Jakarta Station' },
          },
        },
      });

      const result = await service.getAirQuality('city-123');

      expect(result).toMatchObject({
        aqi: 20,
        stationName: 'Jakarta Station',
        humidityLevel: undefined,
        temperatureLevel: undefined,
        pm1Level: undefined,
        pm10Level: undefined,
        pm25Level: undefined,
      });
    });

    it('returns null and logs error when axios throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await service.getAirQuality('city-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching AQI data from AQICN',
        expect.anything()
      );
      consoleSpy.mockRestore();
    });
  });

  // --- parseWordingAqiCn ---

  describe('parseWordingAqiCn', () => {
    const baseData = {
      stationName: 'Jakarta Station',
      aqi: 42,
      aqiLabel: 'Good',
      humidityLevel: 65,
      temperatureLevel: 30,
      pm1Level: 10,
      pm1Label: 'Good',
      pm10Level: 80,
      pm10Label: 'Moderate',
      pm25Level: 45,
      pm25Label: 'Good',
    };

    it('returns a string with all fields when all data is present', () => {
      const result = service.parseWordingAqiCn(baseData);

      expect(result).toContain('<b>[AQICN]</b> Data from <b>Jakarta Station</b>');
      expect(result).toContain('Current AQI: 42 (<b>Good</b>)');
      expect(result).toContain('Humidity: 65%');
      expect(result).toContain('Temperature: 30°C');
      expect(result).toContain('PM1: 10 (<b>Good</b>)');
      expect(result).toContain('PM10: 80 (<b>Moderate</b>)');
      expect(result).toContain('PM2.5: 45 (<b>Good</b>)');
    });

    it('omits humidity line when humidityLevel is falsy', () => {
      const result = service.parseWordingAqiCn({ ...baseData, humidityLevel: null });

      expect(result).not.toContain('Humidity');
    });

    it('omits temperature line when temperatureLevel is falsy', () => {
      const result = service.parseWordingAqiCn({ ...baseData, temperatureLevel: 0 });

      expect(result).not.toContain('Temperature');
    });

    it('omits PM1 line when pm1Level is falsy', () => {
      const result = service.parseWordingAqiCn({ ...baseData, pm1Level: null });

      expect(result).not.toContain('PM1:');
    });

    it('omits PM10 line when pm10Level is falsy', () => {
      const result = service.parseWordingAqiCn({ ...baseData, pm10Level: undefined });

      expect(result).not.toContain('PM10:');
    });

    it('omits PM2.5 line when pm25Level is falsy', () => {
      const result = service.parseWordingAqiCn({ ...baseData, pm25Level: null });

      expect(result).not.toContain('PM2.5:');
    });

    it('returns only the header and AQI line when all optional fields are absent', () => {
      const result = service.parseWordingAqiCn({
        stationName: 'Test Station',
        aqi: 10,
        aqiLabel: 'Good',
        humidityLevel: null,
        temperatureLevel: null,
        pm1Level: null,
        pm1Label: null,
        pm10Level: null,
        pm10Label: null,
        pm25Level: null,
        pm25Label: null,
      });

      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('<b>[AQICN]</b> Data from <b>Test Station</b>');
      expect(lines[1]).toBe('Current AQI: 10 (<b>Good</b>)');
    });

    it('joins all lines with newline characters', () => {
      const result = service.parseWordingAqiCn(baseData);

      expect(result).toMatch(/\n/);
      expect(result.split('\n')).toHaveLength(7);
    });
  });
});