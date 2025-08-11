import cron from 'node-cron';
import { env } from '../config/env';
import { WatchItem } from '../models/WatchItem';
import { getLatestChapter } from '../services/mangadex';
import { TelegramSubscription } from '../models/TelegramSubscription';
import { sendTelegram } from '../services/telegram';

export const isNewChapter = (lastKnown: number, latest: number) => latest > lastKnown;

export const startReleaseJob = () => {
  cron.schedule(env.cronSchedule, async () => {
    const items = await WatchItem.find();
    const byManga: Record<string, typeof items> = {};
    for (const item of items) {
      if (!byManga[item.mangaId]) byManga[item.mangaId] = [];
      byManga[item.mangaId].push(item);
    }
    for (const mangaId of Object.keys(byManga)) {
      const latest = await getLatestChapter(mangaId);
      for (const item of byManga[mangaId]) {
        if (isNewChapter(item.lastKnownChapter, latest)) {
          item.lastKnownChapter = latest;
          await item.save();
          if (item.notify) {
            const subs = await TelegramSubscription.find({ userId: item.userId, active: true });
            for (const sub of subs) {
              await sendTelegram(sub.chatId, `Nouveau chapitre pour ${item.title}: ch.${latest}. Ouvre l'app pour le détail.`);
            }
          }
        }
      }
    }
  });
};
