'use client';

import { useState } from 'react';
import { Upload as UploadIcon } from 'lucide-react';
import { api } from '@/lib/api';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    try {
      // 1) Init
      const { data: init } = await api.post('/videos/upload/init', {
        contentType: file.type,
        caption,
      });

      // 2) Direct PUT to S3 (presigned)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(xhr));
        xhr.onerror = () => reject(new Error('Yükləmə xətası'));
        xhr.open('PUT', init.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // 3) Probe video metadata
      const meta = await probeVideo(file);

      // 4) Finalize
      setStatus('processing');
      await api.post(`/videos/${init.videoId}/upload/finalize`, {
        durationSec: meta.duration,
        width: meta.width,
        height: meta.height,
        sizeBytes: file.size,
      });

      setStatus('done');
    } catch (e: any) {
      setError(e.message ?? 'Yükləmə alınmadı');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Video yüklə</h1>

      <label className="block border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center hover:border-buta-500 cursor-pointer transition">
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <UploadIcon className="w-10 h-10 mx-auto mb-3 text-zinc-500" />
        <p className="text-zinc-300">{file ? file.name : 'Klik edib video seç'}</p>
        <p className="text-xs text-zinc-500 mt-1">MP4, MOV, WebM · max 180 saniyə</p>
      </label>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Təsvir yaz... #hashtag @qeyd"
        maxLength={2200}
        rows={3}
        className="w-full mt-4 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500 resize-none"
      />

      {status === 'uploading' && (
        <div className="mt-4">
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-buta-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-2">Yüklənir... {progress}%</p>
        </div>
      )}
      {status === 'processing' && (
        <p className="mt-4 text-sm text-buta-400">Video emal olunur, bir az gözləyin...</p>
      )}
      {status === 'done' && (
        <p className="mt-4 text-sm text-green-400">✓ Yükləndi! Emal bitəndə feed-də görünəcək.</p>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || status === 'uploading' || status === 'processing'}
        className="w-full mt-4 py-3 bg-buta-500 hover:bg-buta-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
      >
        Paylaş
      </button>
    </div>
  );
}

function probeVideo(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.onerror = () => reject(new Error('Video metadata alınmadı'));
    video.src = url;
  });
}
