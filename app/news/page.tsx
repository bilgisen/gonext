// app/news/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { NewsListClient } from './NewsListClient';
import { urlHelpers } from '../../lib/urlFilters';
import TrendingArticles from '@/components/front-category/TrendingArticles';

interface NewsListPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ searchParams }: NewsListPageProps): Promise<Metadata> {
  // Handle Promise-based searchParams
  const params = await searchParams as { [key: string]: string | string[] | undefined };

  const filters = urlHelpers.parseNewsFilters(new URLSearchParams(
    Object.entries(params).map(([key, value]) =>
      Array.isArray(value) ? [key, value[0]] : [key, value || '']
    ).filter(([_, value]) => value)
  ));

  const title = filters.category
    ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} News`
    : filters.tag
    ? `${filters.tag.charAt(0).toUpperCase() + filters.tag.slice(1)} Tag`
    : filters.search
    ? `Search Results for "${filters.search}"`
    : 'Latest News';

  const description = filters.category
    ? `Latest news in ${filters.category} category.`
    : filters.tag
    ? `News tagged with ${filters.tag}.`
    : filters.search
    ? `Search results for "${filters.search}".`
    : 'Latest news, category filtering, search and more.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function NewsListPage({ searchParams }: NewsListPageProps) {
  // Handle Promise-based searchParams
  const params = await searchParams as { [key: string]: string | string[] | undefined };
  
  // Parse and validate filters
  const filters = urlHelpers.parseNewsFilters(new URLSearchParams(
    Object.entries(params).map(([key, value]) => 
      Array.isArray(value) ? [key, value[0]] : [key, value || '']
    ).filter(([_, value]) => value)
  ));

  // Convert filters to the format expected by the NewsListClient
  const clientFilters = {
    ...filters,
    page: 1, // Default to first page
    limit: 15, // Show 15 items per page
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - News List (3/4 width) */}
        <div className="w-full md:w-3/4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {filters.category 
                ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} News`
                : filters.tag
                ? `Tag: ${filters.tag}`
                : filters.search
                ? `Search Results for "${filters.search}"`
                : 'Latest News'}
            </h1>
            {filters.search && (
              <p className="text-muted-foreground">
                Showing results for &quot;{filters.search}&quot;
              </p>
            )}
          </div>

          <Suspense fallback={<NewsListSkeleton />}>
            <NewsListClient initialFilters={clientFilters} />
          </Suspense>
        </div>

        {/* Right Column - Trending Articles (1/4 width) */}
        <div className="w-full md:w-1/4 space-y-6">
          <div className="sticky top-4">
            <Suspense fallback={<div className="h-64 bg-muted/50 rounded-lg animate-pulse" />}>
              <TrendingArticles limit={5} period="daily" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
function NewsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
          <div className="relative w-full pt-[56.25%] bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="p-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3 animate-pulse" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2 animate-pulse" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6 mb-2 animate-pulse" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
