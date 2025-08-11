import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './utils/config';
import authRoutes from './routes/auth';
import mangaRoutes from './routes/manga';
import watchlistRoutes from './routes/watchlist';
import progressRoutes from './routes/progress';
import notifyRoutes from './routes/notify';
import { startReleaseJob } from './jobs/checkReleases';
import { bot } from './telegram/bot';

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/manga', mangaRoutes);
app.use('/watchlist', watchlistRoutes);
app.use('/progress', progressRoutes);
app.use('/notify', notifyRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  if (process.env.NODE_ENV !== 'test') {
    bot.launch();
    startReleaseJob();
  }
});

export default app;
