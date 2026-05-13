'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share2, Music2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCount } from '@/lib/utils';

interface Video {
  id: string;
  caption?: string;
  hlsManifestUrl?: string;
  originalKey?: string;
  thumbnailUrl?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  isLiked?: boolean;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  audio?: { name: string; artistName?: string };
}

export function VideoPlayer({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(video.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video.hlsManifestUrl) return;

    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = video.hlsManifestUrl;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(video.hlsManifestUrl);
      hls.attachMedia(el);
      return () => hls.destroy();
    }
  }, [video.hlsManifestUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          el.play().catch(() => {});
          setPlaying(true);
        } else {
          el.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await api.delete(`/videos/${video.id}/like`);
      else await api.post(`/videos/${video.id}/like`);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted={false}
        poster={video.thumbnailUrl}
        onClick={() => {
          const el = videoRef.current;
          if (!el) return;
          if (el.paused) el.play();
          else el.pause();
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-10">
        <Link href={`/@${video.user.username}`} className="relative">
          <img
            src={video.user.avatarUrl ?? '/avatar-default.png'}
            alt={video.user.displayName}
            className="w-12 h-12 rounded-full border-2 border-white object-cover"
          />
        </Link>
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <Heart
            className={`w-9 h-9 ${liked ? 'fill-buta-500 text-buta-500' : 'text-white'}`}
            strokeWidth={1.5}
          />
          <span className="text-xs text-white">{formatCount(likeCount)}</span>
        </button>
        <Link href={`/video/${video.id}#comments`} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-9 h-9 text-white" strokeWidth={1.5} />
          <span className="text-xs text-white">{formatCount(video.commentCount)}</span>
        </Link>
        <button className="flex flex-col items-center gap-1">
          <Bookmark className="w-9 h-9 text-white" strokeWidth={1.5} />
          <span className="text-xs text-white">{formatCount(video.saveCount)}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Share2 className="w-9 h-9 text-white" strokeWidth={1.5} />
          <span className="text-xs text-white">{formatCount(video.shareCount)}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 right-20 bottom-6 z-10 text-white">
        <Link href={`/@${video.user.username}`} className="font-semibold text-lg">
          @{video.user.username}
        </Link>
        {video.caption && <p className="text-sm mt-2 line-clamp-3">{video.caption}</p>}
        {video.audio && (
          <div className="flex items-center gap-2 mt-3 text-xs">
            <Music2 className="w-3 h-3" />
            <span className="truncate">
              {video.audio.name}
              {video.audio.artistName ? ` — ${video.audio.artistName}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Pause indicator */}
      {!playing && video.hlsManifestUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
            <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
