import { Router } from 'express';
import { searchManga, getMangaChapters } from '../services/mangadexService';
import { getMangaInfo } from '../services/anilistService';

const router = Router();

router.get('/search', async (req, res) => {
  const q = (req.query.q as string) || '';
  const data = await searchManga(q);
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const chapters = await getMangaChapters(id);
  res.json(chapters);
});

router.get('/', async (_req, res) => {
  res.json({ message: 'manga endpoint' });
});

export default router;
