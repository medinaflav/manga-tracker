import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Progress } from '../models/Progress';

const router = Router();

router.get('/:mangaId', authMiddleware, async (req: AuthRequest, res) => {
  const prog = await Progress.findOne({ userId: req.userId, mangaId: req.params.mangaId });
  res.json(prog);
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({ mangaId: z.string(), chapter: z.number(), page: z.number().optional() });
  try {
    const data = schema.parse(req.body);
    const prog = await Progress.findOneAndUpdate(
      { userId: req.userId, mangaId: data.mangaId },
      { ...data, userId: req.userId, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(prog);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
