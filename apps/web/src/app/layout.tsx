import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Buta — Azərbaycan dilində qısa video platforması',
  description:
    'Buta — yerli yaradıcıların doğma dildə danışdığı yer. Qısa video bölüş, kəşf et, izlə.',
  applicationName: 'Buta',
  keywords: ['buta', 'video', 'azərbaycan', 'tiktok azərbaycan', 'qısa video'],
};

export const viewport: Viewport = {
  themeColor: '#ee5006',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={inter.variable}>
      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 pb-16 md:pb-0">{children}</main>
          </div>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
