// components/front-category/TrendingArticles.tsx
'use client';

import Link from 'next/link';
import { TrendingArticle, useTrendingArticles } from '@/hooks/useTrendingArticles';
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Export the interface
export interface TrendingArticlesProps {
  limit?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export default function TrendingArticles({ limit = 6, period = 'daily' }: TrendingArticlesProps) {
  const { data: articles, isLoading, error } = useTrendingArticles(period, limit);

  if (isLoading) {
    return <div>Loading trending articles...</div>;
  }

  if (error) {
    console.error('Error loading trending articles:', error);
    return <div>Failed to load trending articles</div>;
  }

  if (!articles || articles.length === 0) {
    return <div>No trending articles found</div>;
  }

  return (
    <div className="space-y-4 sticky">
      <h2 className="text-xl font-bold">Trending Now</h2>
      <Separator className="my-2" />
      <div className="space-y-3">
        {articles.map((article: TrendingArticle, index: number) => (
          <div key={article.id} className="border-b pb-3 last:border-b-0">
            <Link href={`/news/${article.slug}`} className="block hover:opacity-80 transition-opacity">
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-muted-foreground/70">{index + 1}.</span>
                <div>
                  <h3 className="font-medium line-clamp-2">{article.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground/50 mt-1">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                    </span>
                    <span className="hidden mx-2">•</span>
                    <span className="hidden">{article.view_count ?? 0} views</span>
                    {article.trending_score != null && article.trending_score !== 0 && (
                      <span className="ml-2 hidden text-xs text-blue-500">(Trend: {article.trending_score})</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}