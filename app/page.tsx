// app/page.tsx
'use client';

import { Suspense } from 'react';
import { BentoFront } from './[category]/BentoFront';
import { useNews } from '@/hooks/useNews';
import { NewsItem } from '@/types/news';
import FrontCategoryLayoutOne from '@/components/front-category/front-cat-layout-one';
import FrontCardLayoutTwo from '@/components/front-category/front-card-layout-two';

function HomePageContent() {
  // Fetch all news for the Bento layout
  const { data, isLoading, error } = useNews({
    limit: 24,
    sort: 'newest',
    page: 1
  });

  // Extract news items from the response data
  const allNews = data?.pages[0]?.data?.items || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error loading news: {error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!allNews || allNews.length === 0) {
    if (!isLoading) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No news available at the moment. Please check back later.</p>
        </div>
      );
    }
    return null;
  }

  // Define categories for the Bento layout
  const bentoCategories = {
    // First row
    firstLarge: 'business',
    firstSmall1: 'world',
    firstSmall2: 'business',
    // Second row
    second1: 'business',
    second2: 'world',
    // Third row
    third1: 'business',
    third2: 'world',
    third3: 'world'
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Featured Section with BentoFront */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Featured Stories</h2>
        <BentoFront news={allNews} categories={bentoCategories} />
      </section>
      
      {/* Category Sections */}
      <section className="space-y-12">
        <h2 className="text-3xl font-bold mb-6">Browse by Category</h2>
        
       
        
        {/* Business */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Business</h3>
          <div className="">
            <FrontCategoryLayoutOne category="science" limit={5} />
          </div>
        </div>
        
        {/* World */}
         <div className="space-y-4">
          <h3 className="text-2xl font-semibold">World News</h3>
          
            <FrontCardLayoutTwo category="world" limit={5} />
          
        </div>

      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-xl" />
        ))}
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
