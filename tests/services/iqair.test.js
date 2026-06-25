jest.mock('axios');
jest.mock('../../helpers/aqi');

describe('IQAir service', () => {
  const ORIGINAL_ENV = process.env;

  let axios;
  let aqiHelpers;
  let service;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };

    axios = require('axios');
    aqiHelpers = require('../../helpers/aqi');
    service = require('../../services/iqair');
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  // --- getAirQuality ---

  describe('getAirQuality', () => {
    it('returns null and logs error when IQAIR_MAPPING is not set', async () => {
      process.env.IQAIR_MAPPING = undefined;
      jest.resetModules();
      const freshService = require('../../services/iqair');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await freshService.getAirQuality('city-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('IQAIR_MAPPING is not set');
      consoleSpy.mockRestore();
    });

    it('returns null and logs error when city is not in mapping', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAirQuality('unknown-city');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('City not found for unknown-city');
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
            current: {
              pollution: { aqius: 42 },
              weather: { hu: 60, tp: 28, heatIndex: 31 },
            },
          },
        },
      });

      const result = await service.getAirQuality('CITY-123');

      expect(result).not.toBeNull();
      expect(axios.get).toHaveBeenCalledWith(
        'http://api.airvisual.com/v2/city',
        {
          params: {
            key: 'test-token',
            city: 'city-123',
            state: 'state-123',
            country: 'country-123',
          },
        }
      );
    });

    it('returns the correct AQI data shape on a successful API call', async () => {
      aqiHelpers.transformAqiToLabel.mockReturnValue('Moderate');

      axios.get.mockResolvedValue({
        data: {
          data: {
            current: {
              pollution: { aqius: 75 },
              weather: { hu: 65, tp: 30, heatIndex: 34 },
            },
          },
        },
      });

      const result = await service.getAirQuality('city-123');

      expect(result).toEqual({
        aqiLevel: 75,
        aqiLabel: 'Moderate',
        city: 'city-123',
        humidityLevel: 65,
        temperatureLevel: 30,
        heatIndexLevel: 34,
      });
    });

    it('returns correct data when optional weather fields are missing', async () => {
      aqiHelpers.transformAqiToLabel.mockReturnValue('Good');

      axios.get.mockResolvedValue({
        data: {
          data: {
            current: {
              pollution: { aqius: 20 },
              weather: {},
            },
          },
        },
      });

      const result = await service.getAirQuality('city-123');

      expect(result).toMatchObject({
        aqiLevel: 20,
        city: 'city-123',
        humidityLevel: undefined,
        temperatureLevel: undefined,
        heatIndexLevel: undefined,
      });
    });

    it('returns correct data when current is missing entirely', async () => {
      aqiHelpers.transformAqiToLabel.mockReturnValue('Good');

      axios.get.mockResolvedValue({
        data: { data: {} },
      });

      const result = await service.getAirQuality('city-123');

      expect(result).toMatchObject({
        aqiLevel: undefined,
        humidityLevel: undefined,
        temperatureLevel: undefined,
        heatIndexLevel: undefined,
      });
    });

    it('returns null and logs error when axios throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await service.getAirQuality('city-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching AQI data from IQAIR',
        expect.anything()
      );
      consoleSpy.mockRestore();
    });
  });

  // --- parseWordingIqAir ---

  describe('parseWordingIqAir', () => {
    const baseData = {
      city: 'city-123',
      aqiLevel: 75,
      aqiLabel: 'Moderate',
      humidityLevel: 65,
      temperatureLevel: 30,
      heatIndexLevel: 34,
    };

    it('returns a string with all fields when all data is present', () => {
      const result = service.parseWordingIqAir(baseData);

      expect(result).toContain('<b>[IQAIR]</b> Data from <b>city-123</b>');
      expect(result).toContain('Current AQI: 75 (<b>Moderate</b>)');
      expect(result).toContain('Humidity: 65%');
      expect(result).toContain('Temperature: 30°C');
      expect(result).toContain('Feels Like: 34°C');
    });

    it('omits humidity line when humidityLevel is falsy', () => {
      const result = service.parseWordingIqAir({ ...baseData, humidityLevel: null });

      expect(result).not.toContain('Humidity');
    });

    it('omits temperature line when temperatureLevel is falsy', () => {
      const result = service.parseWordingIqAir({ ...baseData, temperatureLevel: 0 });

      expect(result).not.toContain('Temperature');
    });

    it('omits feels like line when heatIndexLevel is falsy', () => {
      const result = service.parseWordingIqAir({ ...baseData, heatIndexLevel: null });

      expect(result).not.toContain('Feels Like');
    });

    it('returns only header and AQI line when all optional fields are absent', () => {
      const result = service.parseWordingIqAir({
        city: 'city-456',
        aqiLevel: 10,
        aqiLabel: 'Good',
        humidityLevel: null,
        temperatureLevel: null,
        heatIndexLevel: null,
      });

      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('<b>[IQAIR]</b> Data from <b>city-456</b>');
      expect(lines[1]).toBe('Current AQI: 10 (<b>Good</b>)');
    });

    it('joins all lines with newline characters', () => {
      const result = service.parseWordingIqAir(baseData);

      // All 5 fields present → 5 lines → 4 newlines
      expect(result.split('\n')).toHaveLength(5);
    });
  });
});