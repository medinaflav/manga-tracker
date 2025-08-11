import { Router } from 'express';
import { randomBytes } from 'crypto';
import OneTimeToken from '../models/OneTimeToken';

const router = Router();
const BOT_NAME = process.env.BOT_NAME || 'MangaTrackerBot';

router.post('/telegram/link-url', async (_req, res) => {
  const token = randomBytes(16).toString('hex');
  await OneTimeToken.create({
    token,
    userId: undefined,
    purpose: 'telegram_link',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  res.json({ url: `https://t.me/${BOT_NAME}?start=${token}` });
});

router.post('/telegram/unsubscribe', async (_req, res) => {
  res.status(204).end();
});

export default router;
