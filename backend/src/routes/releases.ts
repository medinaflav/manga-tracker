import { Router } from 'express';
import { getLatestReleases } from '../services/mangadex';

const router = Router();

router.get('/latest', async (_req, res) => {
  const releases = await getLatestReleases();
  res.json(releases);
});

export default router;
