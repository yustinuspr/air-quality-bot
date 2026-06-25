const { transformAqiToLabel } = require('../../helpers/aqi');

describe('transformAqiToLabel', () => {
  describe('Good (0 - 50)', () => {
    it('returns "Good" for AQI 0', () => {
      expect(transformAqiToLabel(0)).toBe('Good');
    });

    it('returns "Good" for AQI 25', () => {
      expect(transformAqiToLabel(25)).toBe('Good');
    });

    it('returns "Good" for AQI 50 (boundary)', () => {
      expect(transformAqiToLabel(50)).toBe('Good');
    });
  });

  describe('Moderate (51 - 100)', () => {
    it('returns "Moderate" for AQI 51', () => {
      expect(transformAqiToLabel(51)).toBe('Moderate');
    });

    it('returns "Moderate" for AQI 75', () => {
      expect(transformAqiToLabel(75)).toBe('Moderate');
    });

    it('returns "Moderate" for AQI 100 (boundary)', () => {
      expect(transformAqiToLabel(100)).toBe('Moderate');
    });
  });

  describe('Unhealthy for Sensitive Groups (101 - 150)', () => {
    it('returns "Unhealthy for Sensitive Groups" for AQI 101', () => {
      expect(transformAqiToLabel(101)).toBe('Unhealthy for Sensitive Groups');
    });

    it('returns "Unhealthy for Sensitive Groups" for AQI 125', () => {
      expect(transformAqiToLabel(125)).toBe('Unhealthy for Sensitive Groups');
    });

    it('returns "Unhealthy for Sensitive Groups" for AQI 150 (boundary)', () => {
      expect(transformAqiToLabel(150)).toBe('Unhealthy for Sensitive Groups');
    });
  });

  describe('Unhealthy (151 - 200)', () => {
    it('returns "Unhealthy" for AQI 151', () => {
      expect(transformAqiToLabel(151)).toBe('Unhealthy');
    });

    it('returns "Unhealthy" for AQI 175', () => {
      expect(transformAqiToLabel(175)).toBe('Unhealthy');
    });

    it('returns "Unhealthy" for AQI 200 (boundary)', () => {
      expect(transformAqiToLabel(200)).toBe('Unhealthy');
    });
  });

  describe('Very Unhealthy (201 - 300)', () => {
    it('returns "Very Unhealthy" for AQI 201', () => {
      expect(transformAqiToLabel(201)).toBe('Very Unhealthy');
    });

    it('returns "Very Unhealthy" for AQI 250', () => {
      expect(transformAqiToLabel(250)).toBe('Very Unhealthy');
    });

    it('returns "Very Unhealthy" for AQI 300 (boundary)', () => {
      expect(transformAqiToLabel(300)).toBe('Very Unhealthy');
    });
  });

  describe('Hazardous (301+)', () => {
    it('returns "Hazardous" for AQI 301', () => {
      expect(transformAqiToLabel(301)).toBe('Hazardous');
    });

    it('returns "Hazardous" for AQI 500', () => {
      expect(transformAqiToLabel(500)).toBe('Hazardous');
    });
  });
});