import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import mangaRoutes from './routes/manga';
import releasesRoutes from './routes/releases';
import watchlistRoutes from './routes/watchlist';
import progressRoutes from './routes/progress';
import notifyRoutes from './routes/notify';
import legalRoutes from './routes/legal';
import userRoutes from './routes/user';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/auth', authRoutes);
  app.use('/manga', mangaRoutes);
  app.use('/releases', releasesRoutes);
  app.use('/watchlist', watchlistRoutes);
  app.use('/progress', progressRoutes);
  app.use('/notify', notifyRoutes);
  app.use('/legal', legalRoutes);
  app.use('/', userRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);
  return app;
};
