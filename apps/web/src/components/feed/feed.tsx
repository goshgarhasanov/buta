'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { VideoPlayer } from './video-player';
import { cn } from '@/lib/utils';

type FeedTab = 'foryou' | 'following';

interface FeedResponse {
  items: any[];
  nextCursor: string | null;
}

async function fetchFeed(tab: FeedTab, cursor?: string): Promise<FeedResponse> {
  const { data } = await api.get(`/feed/${tab}`, { params: { cursor } });
  return data;
}

export function Feed({ initialTab = 'foryou' as FeedTab }) {
  const [tab, setTab] = useState<FeedTab>(initialTab);

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed', tab],
    queryFn: ({ pageParam }) => fetchFeed(tab, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const videos = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="relative w-full max-w-[440px] h-full">
      {/* Tab switcher */}
      <div className="absolute top-4 left-0 right-0 z-20 flex justify-center gap-6 text-sm">
        <TabBtn active={tab === 'following'} onClick={() => setTab('following')}>
          İzlədiklərim
        </TabBtn>
        <span className="text-zinc-700">|</span>
        <TabBtn active={tab === 'foryou'} onClick={() => setTab('foryou')}>
          Sənin üçün
        </TabBtn>
      </div>

      {/* Vertical snap container */}
      <div
        className="snap-feed no-scrollbar h-full overflow-y-scroll"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 600 && hasNextPage) {
            fetchNextPage();
          }
        }}
      >
        {isLoading && (
          <div className="h-full flex items-center justify-center text-zinc-500">Yüklənir...</div>
        )}
        {videos.map((v) => (
          <div key={v.id} className="snap-item h-full">
            <VideoPlayer video={v} />
          </div>
        ))}
        {!isLoading && videos.length === 0 && (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Hələ video yoxdur.
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'font-semibold transition',
        active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300',
      )}
    >
      {children}
    </button>
  );
}
