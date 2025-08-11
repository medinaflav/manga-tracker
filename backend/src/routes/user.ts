import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { WatchItem } from '../models/WatchItem';
import { Progress } from '../models/Progress';
import { TelegramSubscription } from '../models/TelegramSubscription';
import { OneTimeToken } from '../models/OneTimeToken';

const router = Router();

router.delete('/me', authMiddleware, async (req: AuthRequest, res) => {
  await User.deleteOne({ _id: req.userId });
  await WatchItem.deleteMany({ userId: req.userId });
  await Progress.deleteMany({ userId: req.userId });
  await TelegramSubscription.deleteMany({ userId: req.userId });
  await OneTimeToken.deleteMany({ userId: req.userId });
  res.json({ ok: true });
});

export default router;
