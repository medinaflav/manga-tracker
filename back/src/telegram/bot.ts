import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
export const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Bienvenue sur Manga Tracker!'));

export const sendNotification = async (chatId: string, message: string) => {
  await bot.telegram.sendMessage(chatId, message);
};
