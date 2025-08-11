import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mangatracker',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botName: process.env.BOT_NAME || '',
  cronSchedule: process.env.CRON_SCHEDULE || '*/20 * * * *'
};
