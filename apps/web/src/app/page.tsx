import { Feed } from '@/components/feed/feed';

export default function HomePage() {
  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex justify-center">
      <Feed initialTab="foryou" />
    </div>
  );
}
