import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { WatchItem } from '../models/WatchItem';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const items = await WatchItem.find({ userId: req.userId });
  res.json(items);
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({ mangaId: z.string(), title: z.string(), coverUrl: z.string().optional() });
  try {
    const data = schema.parse(req.body);
    const item = await WatchItem.findOneAndUpdate(
      { userId: req.userId, mangaId: data.mangaId },
      { ...data, userId: req.userId },
      { upsert: true, new: true }
    );
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:mangaId', authMiddleware, async (req: AuthRequest, res) => {
  await WatchItem.deleteOne({ userId: req.userId, mangaId: req.params.mangaId });
  res.json({ ok: true });
});

export default router;
