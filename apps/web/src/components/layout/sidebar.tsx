'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Inbox, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Ana səhifə', icon: Home },
  { href: '/discover', label: 'Kəşf et', icon: Compass },
  { href: '/upload', label: 'Yüklə', icon: Plus, highlight: true },
  { href: '/inbox', label: 'Bildirişlər', icon: Inbox },
  { href: '/profile', label: 'Profil', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-black flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <ButaLogo className="w-9 h-9" />
          <span className="text-2xl font-bold tracking-tight">Buta</span>
        </Link>
      </div>

      <div className="px-3 mb-4">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Axtar...</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-md transition',
                active ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
                highlight && 'text-buta-400',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 text-xs text-zinc-500">
        © 2026 Buta · <Link href="/legal" className="hover:text-zinc-300">Hüquqi</Link>
      </div>
    </aside>
  );
}

function ButaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6f1a" />
          <stop offset="1" stopColor="#cf3a04" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#bg)" />
      <path
        d="M32 12c-6 0-12 4-12 12 0 8 8 12 8 18 0 4-3 6-3 6s10-2 14-10c3-6 1-14-3-18-1-1-1-3 0-4 1-2-2-4-4-4z"
        fill="#fff"
      />
    </svg>
  );
}
