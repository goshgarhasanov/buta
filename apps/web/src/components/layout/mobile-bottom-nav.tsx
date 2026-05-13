'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Ana', icon: Home },
  { href: '/discover', label: 'Kəşf', icon: Compass },
  { href: '/upload', label: '', icon: PlusSquare },
  { href: '/inbox', label: 'Bildiriş', icon: Inbox },
  { href: '/profile', label: 'Mən', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-zinc-800 flex z-50">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5',
              active ? 'text-white' : 'text-zinc-500',
            )}
          >
            <Icon className={cn('w-6 h-6', href === '/upload' && 'w-9 h-9 text-buta-400')} />
            {label && <span className="text-[10px]">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
