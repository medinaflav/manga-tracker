import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env';
import { OneTimeToken } from '../models/OneTimeToken';
import { TelegramSubscription } from '../models/TelegramSubscription';

export const bot = env.telegramToken ? new TelegramBot(env.telegramToken, { polling: true }) : null;

if (bot) {
  bot.onText(/\/start (.+)/, async (_msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const token = match?.[1];
    if (!token) return;
    const ott = await OneTimeToken.findOne({ token, purpose: 'telegram_link', consumedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
    if (!ott) return;
    await TelegramSubscription.findOneAndUpdate(
      { userId: ott.userId },
      { chatId: _msg.chat.id, active: true, linkedAt: new Date() },
      { upsert: true }
    );
    ott.consumedAt = new Date();
    await ott.save();
    bot.sendMessage(_msg.chat.id, 'Connexion réussie !');
  });
}

export const sendTelegram = async (chatId: number, text: string) => {
  if (bot) {
    await bot.sendMessage(chatId, text);
  }
};
