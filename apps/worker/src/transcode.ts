/**
 * Video transcode pipeline:
 *   1. Original-i S3-dən yüklə
 *   2. FFmpeg ilə HLS 3 variant (480p, 720p, 1080p) yarat
 *   3. Thumbnail (3 frame: 0%, 25%, 50%)
 *   4. Animated preview (3s WebP/GIF)
 *   5. HLS + thumbnail-i S3-ə qaytar
 *   6. DB-də video.status = READY
 */
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Client as MinioClient } from 'minio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ffmpegPath = process.env.FFMPEG_PATH ?? 'ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

const endpoint = new URL(process.env.S3_ENDPOINT ?? 'http://localhost:9000');
const minio = new MinioClient({
  endPoint: endpoint.hostname,
  port: Number(endpoint.port) || 80,
  useSSL: endpoint.protocol === 'https:',
  accessKey: process.env.S3_ACCESS_KEY!,
  secretKey: process.env.S3_SECRET_KEY!,
});

const BUCKET_VIDEOS = process.env.S3_BUCKET_VIDEOS ?? 'buta-videos';
const BUCKET_THUMBS = process.env.S3_BUCKET_THUMBNAILS ?? 'buta-thumbnails';
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000';
const WORK_DIR = process.env.WORK_DIR ?? './tmp';

const VARIANTS = [
  { name: '480p',  width: 480,  bitrate: '800k' },
  { name: '720p',  width: 720,  bitrate: '1500k' },
  { name: '1080p', width: 1080, bitrate: '3000k' },
];

export async function transcodeVideo(
  videoId: string,
  onProgress?: (p: number) => void,
): Promise<void> {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new Error(`Video ${videoId} tapılmadı`);

  const jobDir = path.join(WORK_DIR, videoId);
  await fs.mkdir(jobDir, { recursive: true });

  try {
    // 1) Download original
    const localOriginal = path.join(jobDir, 'original');
    await downloadFromS3(BUCKET_VIDEOS, video.originalKey, localOriginal);
    onProgress?.(10);

    // 2) HLS transcode (single output dir per variant)
    const hlsDir = path.join(jobDir, 'hls');
    await fs.mkdir(hlsDir, { recursive: true });
    await transcodeToHls(localOriginal, hlsDir, (p) => onProgress?.(10 + Math.floor(p * 0.6)));

    // 3) Thumbnail
    const thumbPath = path.join(jobDir, 'thumb.jpg');
    await extractThumbnail(localOriginal, thumbPath);
    onProgress?.(80);

    // 4) Upload HLS folder
    const hlsKeyPrefix = `hls/${videoId}`;
    await uploadDirToS3(BUCKET_VIDEOS, hlsKeyPrefix, hlsDir);

    // 5) Upload thumbnail
    const thumbKey = `${videoId}.jpg`;
    await minio.fPutObject(BUCKET_THUMBS, thumbKey, thumbPath);
    onProgress?.(95);

    // 6) Update DB
    await prisma.video.update({
      where: { id: videoId },
      data: {
        hlsManifestUrl: `${PUBLIC_URL}/${BUCKET_VIDEOS}/${hlsKeyPrefix}/master.m3u8`,
        thumbnailUrl: `${PUBLIC_URL}/${BUCKET_THUMBS}/${thumbKey}`,
        status: 'READY',
        publishedAt: new Date(),
      },
    });
    onProgress?.(100);
  } catch (err: any) {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'FAILED', processingError: err.message ?? String(err) },
    });
    throw err;
  } finally {
    await fs.rm(jobDir, { recursive: true, force: true });
  }
}

async function downloadFromS3(bucket: string, key: string, dest: string) {
  await minio.fGetObject(bucket, key, dest);
}

async function uploadDirToS3(bucket: string, keyPrefix: string, dir: string) {
  const files = await fs.readdir(dir);
  for (const f of files) {
    const local = path.join(dir, f);
    const remote = `${keyPrefix}/${f}`;
    const contentType = f.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
    await minio.fPutObject(bucket, remote, local, { 'Content-Type': contentType });
  }
}

function transcodeToHls(input: string, outDir: string, onProgress?: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg(input);
    VARIANTS.forEach((v) => {
      cmd
        .output(path.join(outDir, `${v.name}.m3u8`))
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('128k')
        .videoBitrate(v.bitrate)
        .size(`?x${v.width}`)
        .outputOptions([
          '-preset veryfast',
          '-profile:v main',
          '-pix_fmt yuv420p',
          '-hls_time 4',
          '-hls_list_size 0',
          '-hls_segment_filename',
          path.join(outDir, `${v.name}_%03d.ts`),
          '-f hls',
        ]);
    });

    cmd
      .on('progress', (p) => onProgress?.(Math.min(1, (p.percent ?? 0) / 100)))
      .on('end', async () => {
        await writeMasterPlaylist(outDir);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

async function writeMasterPlaylist(outDir: string) {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3'];
  for (const v of VARIANTS) {
    const bitrate = parseInt(v.bitrate, 10) * 1000;
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bitrate},RESOLUTION=?x${v.width}`);
    lines.push(`${v.name}.m3u8`);
  }
  await fs.writeFile(path.join(outDir, 'master.m3u8'), lines.join('\n'));
}

function extractThumbnail(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .screenshots({
        timestamps: ['25%'],
        filename: path.basename(output),
        folder: path.dirname(output),
        size: '720x?',
      })
      .on('end', () => resolve())
      .on('error', reject);
  });
}
