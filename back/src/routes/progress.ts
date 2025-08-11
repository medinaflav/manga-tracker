import { Router } from 'express';
import Progress from '../models/Progress';

const router = Router();

router.get('/:mangaId', async (req, res) => {
  const progress = await Progress.findOne({ mangaId: req.params.mangaId });
  res.json(progress);
});

router.post('/', async (req, res) => {
  const progress = await Progress.findOneAndUpdate(
    { mangaId: req.body.mangaId },
    req.body,
    { upsert: true, new: true }
  );
  res.json(progress);
});

export default router;
