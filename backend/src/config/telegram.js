// backend/src/config/telegram.js
import env from './env.js';

export const config = {
  token: env.TELEGRAM_BOT_TOKEN,
  isActive: env.TELEGRAM_BOT_ACTIVE
};

export default config;
