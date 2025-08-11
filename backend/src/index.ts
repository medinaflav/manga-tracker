import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import './services/telegram';
import { startReleaseJob } from './jobs/releaseChecker';

const start = async () => {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
  startReleaseJob();
};

start();
