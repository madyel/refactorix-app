const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const electronConfig = {
  devServerUrl: process.env.ELECTRON_RENDERER_URL || process.env.SMARTIDE_ELECTRON_DEV_SERVER_URL || 'http://localhost:5173',
  window: {
    width: parseNumber(process.env.SMARTIDE_WINDOW_WIDTH, 1440),
    height: parseNumber(process.env.SMARTIDE_WINDOW_HEIGHT, 900),
    minWidth: parseNumber(process.env.SMARTIDE_WINDOW_MIN_WIDTH, 1024),
    minHeight: parseNumber(process.env.SMARTIDE_WINDOW_MIN_HEIGHT, 700),
    backgroundColor: process.env.SMARTIDE_WINDOW_BACKGROUND || '#171717',
  },
  updater: {
    checkDelayMs: parseNumber(process.env.SMARTIDE_UPDATER_CHECK_DELAY_MS, 10_000),
  },
};

module.exports = {
  electronConfig,
};
