'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setAccessToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function upd(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setAccessToken(data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.title ?? 'Qeydiyyat alınmadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Buta-ya qoşul</h1>
          <p className="text-sm text-zinc-400 mt-2">Pulsuz hesab yarat</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={form.username}
            onChange={upd('username')}
            placeholder="İstifadəçi adı"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500"
            required
            pattern="[a-zA-Z0-9_.]{3,30}"
          />
          <input
            value={form.displayName}
            onChange={upd('displayName')}
            placeholder="Görünən ad"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500"
          />
          <input
            value={form.email}
            onChange={upd('email')}
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500"
          />
          <input
            value={form.password}
            onChange={upd('password')}
            type="password"
            placeholder="Parol (min. 8 simvol)"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-buta-500"
            required
            minLength={8}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-buta-500 hover:bg-buta-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Gözləyin...' : 'Qeydiyyatdan keç'}
          </button>
        </form>

        <p className="text-sm text-center text-zinc-400">
          Hesabın var?{' '}
          <Link href="/login" className="text-buta-400 hover:underline">
            Daxil ol
          </Link>
        </p>
      </div>
    </div>
  );
}
