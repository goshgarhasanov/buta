import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const ALLOWED_MIME = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
type Mime = (typeof ALLOWED_MIME)[number];

export class InitUploadDto {
  @IsIn(ALLOWED_MIME as unknown as string[])
  contentType!: Mime;

  @IsOptional()
  @IsString()
  @Length(0, 2200)
  caption?: string;
}

export class FinalizeUploadDto {
  @IsNumber()
  @Min(1)
  @Max(180)
  durationSec!: number;

  @IsInt()
  @Min(1)
  width!: number;

  @IsInt()
  @Min(1)
  height!: number;

  @IsInt()
  @Min(1)
  sizeBytes!: number;
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @Length(0, 2200)
  caption?: string;

  @IsOptional()
  @IsEnum(['PUBLIC', 'FOLLOWERS', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
}

export class ViewDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  watchPercent?: number;

  @IsOptional()
  @IsString()
  source?: string;
}
