import { Router } from 'express';
import WatchItem from '../models/WatchItem';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await WatchItem.find();
  res.json(items);
});

router.post('/', async (req, res) => {
  const item = await WatchItem.create(req.body);
  res.status(201).json(item);
});

router.delete('/:mangaId', async (req, res) => {
  await WatchItem.deleteOne({ mangaId: req.params.mangaId });
  res.status(204).end();
});

export default router;
