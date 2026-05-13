import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSec: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: MinioClient;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = new URL(config.getOrThrow<string>('S3_ENDPOINT'));
    this.client = new MinioClient({
      endPoint: endpoint.hostname,
      port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 80),
      useSSL: endpoint.protocol === 'https:',
      accessKey: config.getOrThrow<string>('S3_ACCESS_KEY'),
      secretKey: config.getOrThrow<string>('S3_SECRET_KEY'),
      region: config.get<string>('S3_REGION', 'us-east-1'),
    });
    this.publicBaseUrl = config.getOrThrow<string>('S3_PUBLIC_URL');
  }

  async presignVideoUpload(userId: string, contentType: string): Promise<PresignedUpload> {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET_VIDEOS');
    const ext = this.extFromMime(contentType);
    const key = `originals/${userId}/${Date.now()}-${nanoid(12)}${ext}`;

    const uploadUrl = await this.client.presignedPutObject(bucket, key, 60 * 10);
    const publicUrl = `${this.publicBaseUrl}/${bucket}/${key}`;
    return { uploadUrl, publicUrl, key, expiresInSec: 600 };
  }

  async presignAvatarUpload(userId: string, contentType: string): Promise<PresignedUpload> {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET_AVATARS');
    const ext = this.extFromMime(contentType);
    const key = `${userId}${ext}`;
    const uploadUrl = await this.client.presignedPutObject(bucket, key, 60 * 5);
    const publicUrl = `${this.publicBaseUrl}/${bucket}/${key}`;
    return { uploadUrl, publicUrl, key, expiresInSec: 300 };
  }

  async statObject(bucket: string, key: string) {
    return this.client.statObject(bucket, key);
  }

  publicUrl(bucket: string, key: string): string {
    return `${this.publicBaseUrl}/${bucket}/${key}`;
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mime] ?? '';
  }
}
