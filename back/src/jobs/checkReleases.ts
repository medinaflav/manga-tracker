import cron from 'node-cron';
import WatchItem from '../models/WatchItem';
import { getMangaChapters } from '../services/mangadexService';

export const startReleaseJob = () => {
  const schedule = process.env.CRON_SCHEDULE || '*/20 * * * *';
  cron.schedule(schedule, async () => {
    const items = await WatchItem.find();
    for (const item of items) {
      const feed = await getMangaChapters(item.mangaId);
      const latest = feed?.data?.[0]?.attributes?.chapter;
      if (latest && Number(latest) > item.lastKnownChapter) {
        item.lastKnownChapter = Number(latest);
        await item.save();
      }
    }
  });
};
