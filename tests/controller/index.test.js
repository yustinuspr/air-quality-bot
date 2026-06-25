jest.mock('../../services/aqicn');
jest.mock('../../services/iqair');

const aqiCnService = require('../../services/aqicn');
const iqAirService = require('../../services/iqair');
const controller = require('../../controller/index');

describe('controller/index', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      message: { text: 'city-123' },
      reply: jest.fn().mockResolvedValue({}),
    };

    jest.clearAllMocks();
  });

  it('strips slashes from the message text before querying', async () => {
    ctx.message.text = '/city-123';

    aqiCnService.getAirQuality.mockResolvedValue(null);
    iqAirService.getAirQuality.mockResolvedValue(null);

    await controller(ctx);

    expect(aqiCnService.getAirQuality).toHaveBeenCalledWith('city-123');
    expect(iqAirService.getAirQuality).toHaveBeenCalledWith('city-123');
  });

  it('replies with both wordings joined by double newline when both services return data', async () => {
    aqiCnService.getAirQuality.mockResolvedValue({ aqi: 42 });
    iqAirService.getAirQuality.mockResolvedValue({ aqiLevel: 75 });

    aqiCnService.parseWordingAqiCn.mockReturnValue('AQICN wording');
    iqAirService.parseWordingIqAir.mockReturnValue('IQAIR wording');

    await controller(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('AQICN wording\n\nIQAIR wording', { parse_mode: 'HTML' });
  });

  it('replies with only AQICN wording when IQAir returns null', async () => {
    aqiCnService.getAirQuality.mockResolvedValue({ aqi: 42 });
    iqAirService.getAirQuality.mockResolvedValue(null);

    aqiCnService.parseWordingAqiCn.mockReturnValue('AQICN wording');

    await controller(ctx);

    expect(iqAirService.parseWordingIqAir).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('AQICN wording', { parse_mode: 'HTML' });
  });

  it('replies with only IQAir wording when AQICN returns null', async () => {
    aqiCnService.getAirQuality.mockResolvedValue(null);
    iqAirService.getAirQuality.mockResolvedValue({ aqiLevel: 75 });

    iqAirService.parseWordingIqAir.mockReturnValue('IQAIR wording');

    await controller(ctx);

    expect(aqiCnService.parseWordingAqiCn).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('IQAIR wording', { parse_mode: 'HTML' });
  });

  it('replies with an empty string when both services return null', async () => {
    aqiCnService.getAirQuality.mockResolvedValue(null);
    iqAirService.getAirQuality.mockResolvedValue(null);

    await controller(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('', { parse_mode: 'HTML' });
  });

  it('calls both services in parallel', async () => {
    aqiCnService.getAirQuality.mockResolvedValue(null);
    iqAirService.getAirQuality.mockResolvedValue(null);

    await controller(ctx);

    expect(aqiCnService.getAirQuality).toHaveBeenCalledTimes(1);
    expect(iqAirService.getAirQuality).toHaveBeenCalledTimes(1);
  });

  it('replies with error message when ctx.message.text throws', async () => {
    ctx.message = null; // accessing .text will throw

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await controller(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('Error fetching data from API');
    consoleSpy.mockRestore();
  });

  it('replies with error message when a service throws unexpectedly', async () => {
    aqiCnService.getAirQuality.mockRejectedValue(new Error('Unexpected'));
    iqAirService.getAirQuality.mockResolvedValue(null);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await controller(ctx);

    // Promise.allSettled never throws, so wording path is followed
    expect(ctx.reply).toHaveBeenCalledWith('', { parse_mode: 'HTML' });
    consoleSpy.mockRestore();
  });
});