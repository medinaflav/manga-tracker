import { Router } from 'express';
import { searchManga, getMangaChapters, getManga } from '../services/mangadex';
import { getAniListInfo } from '../services/anilist';

const router = Router();

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '');
  const results = await searchManga(q);
  res.json(results);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const manga = await getManga(id);
  const chapters = await getMangaChapters(id);
  const ani = await getAniListInfo(manga.title);
  res.json({ manga, aniList: ani, chapters });
});

export default router;
