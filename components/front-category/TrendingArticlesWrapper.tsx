// components/front-category/TrendingArticlesWrapper.tsx
'use client';

import dynamic from 'next/dynamic';
import type { TrendingArticlesProps } from './TrendingArticles';

// Create a skeleton loader that matches the TrendingArticles layout
function TrendingArticlesSkeleton() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Trending Now</h2>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b pb-3 last:border-b-0">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TrendingArticles = dynamic(
  () => import('./TrendingArticles'),
  {
    loading: () => <TrendingArticlesSkeleton />,
    ssr: false
  }
);

export default function TrendingArticlesWrapper({ limit = 5, period = 'daily' }: TrendingArticlesProps) {
  return <TrendingArticles limit={limit} period={period} />;
}