'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CategoryNewsList } from './CategoryNewsList';
import { getDisplayName } from '@/lib/utils/category-utils';

// Client-side only component for trending articles
const TrendingArticlesWrapper = dynamic(
  () => import('@/components/front-category/TrendingArticlesWrapper'),
  { 
    ssr: false, 
    loading: () => <div className="h-64 bg-muted/20 rounded-lg animate-pulse" /> 
  }
);

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | {
    [key: string]: string | string[] | undefined;
  };
}

// We can't use generateMetadata in client components,
// so we'll handle metadata in the parent layout if needed

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState<{ [key: string]: string | string[] | undefined }>({});
  const [displayName, setDisplayName] = useState('');
  const [normalizedSlug, setNormalizedSlug] = useState('');

  useEffect(() => {
    // Handle params and searchParams on client side
    const init = async () => {
      try {
        const resolvedParams = await params;
        const resolvedSearchParams = await searchParams;
        
        const slug = resolvedParams.category;
        const normalized = slug.toLowerCase();
        
        setNormalizedSlug(normalized);
        setDisplayName(getDisplayName(normalized));
        setQuery(
          typeof resolvedSearchParams === 'object' && !('then' in resolvedSearchParams)
            ? resolvedSearchParams
            : {}
        );
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [params, searchParams]);
  
  if (isLoading) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <header className="text-center mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayName} News</h1>
        <p className="text-gray-500">Stay updated with the latest in {displayName}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column - Main content (2/3 width on large screens) */}
        <div className="w-full lg:w-3/4">
          <Suspense fallback={<SkeletonGrid />}>
            <CategoryNewsList category={normalizedSlug} searchParams={query} />
          </Suspense>
        </div>

        {/* Right column - Sidebar (1/3 width on large screens) */}
        <div className="w-full lg:w-1/4 space-y-6">
          <div className="sticky top-24">
            <TrendingArticlesWrapper limit={5} period="daily" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-[200px] gap-4 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-[200px] rounded-xl bg-muted/20 border border-border/30" />
      ))}
    </div>
  );
}
