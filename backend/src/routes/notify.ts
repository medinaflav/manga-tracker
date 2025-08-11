import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { OneTimeToken } from '../models/OneTimeToken';
import { TelegramSubscription } from '../models/TelegramSubscription';
import { env } from '../config/env';

const router = Router();

router.post('/telegram/link-url', authMiddleware, async (req: AuthRequest, res) => {
  const token = crypto.randomBytes(16).toString('hex');
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await OneTimeToken.create({ token, userId: req.userId!, purpose: 'telegram_link', expiresAt: expires });
  const url = `https://t.me/${env.botName}?start=${token}`;
  res.json({ url });
});

router.post('/telegram/unsubscribe', authMiddleware, async (req: AuthRequest, res) => {
  await TelegramSubscription.updateMany({ userId: req.userId }, { active: false });
  res.json({ ok: true });
});

export default router;
