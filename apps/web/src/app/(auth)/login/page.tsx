'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setAccessToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      setAccessToken(data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.title ?? 'Giriş alınmadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Butaya giriş</h1>
          <p className="text-sm text-zinc-400 mt-2">İstifadəçi adı, email və ya telefon ilə</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="İstifadəçi adı / email / telefon"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500"
            required
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Parol"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500"
            required
            autoComplete="current-password"
            minLength={8}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-buta-500 hover:bg-buta-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Gözləyin...' : 'Daxil ol'}
          </button>
        </form>

        <p className="text-sm text-center text-zinc-400">
          Hesabın yoxdur?{' '}
          <Link href="/register" className="text-buta-400 hover:underline">
            Qeydiyyatdan keç
          </Link>
        </p>
      </div>
    </div>
  );
}
