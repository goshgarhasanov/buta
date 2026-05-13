import 'dotenv/config';
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import { transcodeVideo } from './transcode';

const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
      : undefined,
});

const connection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

const concurrency = Number(process.env.CONCURRENCY ?? 2);

const worker = new Worker(
  'video-transcode',
  async (job: Job<{ videoId: string }>) => {
    const { videoId } = job.data;
    logger.info({ videoId }, 'Transcode job başladı');
    await transcodeVideo(videoId, (progress) => job.updateProgress(progress));
    logger.info({ videoId }, 'Transcode job bitdi');
  },
  { connection, concurrency },
);

worker.on('failed', (job, err) => {
  logger.error({ err, videoId: job?.data?.videoId }, 'Job xətası');
});

worker.on('completed', (job) => {
  logger.info({ videoId: job.data.videoId }, '✓ Tamamlandı');
});

logger.info(`🎬 Buta worker hazırdır (concurrency: ${concurrency})`);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM aldı, bağlanır...');
  await worker.close();
  process.exit(0);
});
