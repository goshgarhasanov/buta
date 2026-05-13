import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const numberFmt = new Intl.NumberFormat('az-AZ');

export function formatCount(n: number | bigint): string {
  const num = typeof n === 'bigint' ? Number(n) : n;
  if (num < 1000) return numberFmt.format(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1).replace('.0', '')}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1).replace('.0', '')}M`;
  return `${(num / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
}

const rtf = new Intl.RelativeTimeFormat('az-AZ', { numeric: 'auto' });

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 2629800) return rtf.format(Math.round(diff / 604800), 'week');
  return rtf.format(Math.round(diff / 2629800), 'month');
}
