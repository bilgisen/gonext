import { Metadata } from 'next';
import { Suspense } from 'react';
import { NewsListClient } from './NewsListClient';
import { urlHelpers } from '../../lib/urlFilters';

interface NewsListPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ searchParams }: NewsListPageProps): Promise<Metadata> {
  const filters = urlHelpers.parseNewsFilters(new URLSearchParams(
    Object.entries(searchParams).map(([key, value]) =>
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

export default function NewsListPage({ searchParams }: NewsListPageProps) {
  const filters = urlHelpers.parseNewsFilters(new URLSearchParams(
    Object.entries(searchParams).map(([key, value]) =>
      Array.isArray(value) ? [key, value[0]] : [key, value || '']
    ).filter(([_, value]) => value)
  ));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {filters.category
            ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} News`
            : filters.tag
            ? `${filters.tag.charAt(0).toUpperCase() + filters.tag.slice(1)} Tag`
            : filters.search
            ? `Search Results for "${filters.search}"`
            : 'Latest News'
          }
        </h1>

        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
          {filters.category && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Category: {filters.category}
            </span>
          )}
          {filters.tag && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
              Tag: {filters.tag}
            </span>
          )}
          {filters.search && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
              Search: "{filters.search}"
            </span>
          )}
        </div>
      </div>

      <Suspense fallback={<NewsListSkeleton />}>
        <NewsListClient initialFilters={filters} />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function NewsListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
