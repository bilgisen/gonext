'use client';

import { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { useCategoryNews } from '@/hooks/useCategoryNews';
import { FrontPageCategories } from '@/components/FrontPageCategories';

// Lazy load the card components with proper dynamic imports
const CategoryHero = dynamic(
  () => import('@/app/[category]/categoryHero').then(mod => ({ default: mod.CategoryHero })),
  { ssr: false, loading: () => <div className="h-[500px] bg-muted/20 animate-pulse rounded-xl" /> }
);

const BentoFront = dynamic(
  () => import('@/app/[category]/BentoFront').then(mod => ({ default: mod.BentoFront })),
  { ssr: false, loading: () => <div className="h-[600px] bg-muted/20 animate-pulse rounded-xl" /> }
);

const NewsCard = dynamic(
  () => import('@/app/[category]/NewsCard').then(mod => ({ default: mod.NewsCard })),
  { ssr: false, loading: () => <div className="h-[200px] bg-muted/20 animate-pulse rounded-xl" /> }
);

// Define props interface for CategorySection
interface CategorySectionProps {
  category: string | string[];
  template: React.ComponentType<any> | React.LazyExoticComponent<React.ComponentType<any>>;
  variant?: 'large' | 'small' | 'bento' | 'grid' | 'featured';
  limit?: number;
  className?: string;
  title?: string;
  showTabs?: boolean;
}

// Main component with proper Suspense boundaries
function CategorySection({ 
  category, 
  template: Template, 
  variant, 
  limit = 6, 
  className = '',
  title,
  showTabs = true
}: CategorySectionProps) {
  const { allNews, isLoading, error } = useCategoryNews(category, limit);

  return (
    <Suspense fallback={<div className="h-[500px] bg-muted/20 animate-pulse rounded-xl" />}>
      <FrontPageCategories
        category={category}
        template={Template}
        variant={variant}
        limit={limit}
        className={className}
        title={title}
        showTabs={showTabs}
        allNews={allNews}
        isLoading={isLoading}
        error={error}
      />
    </Suspense>
  );
}

function BusinessWorldNews() {
  // Fetch more items than needed in case we need to filter by category
  const { allNews, isLoading, error } = useCategoryNews(['business', 'world', 'technology', 'sports', 'entertainment'], 12);

  if (isLoading) {
    return <div className="h-[600px] bg-muted/20 animate-pulse rounded-xl" />;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading news: {error.message}</div>;
  }

  // Define categories for each position
  const categories = {
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

  return <BentoFront news={allNews || []} categories={categories} />;
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Business & World News Section - Bento Layout */}
      <section className="mb-16">
        <Suspense fallback={<div className="h-[600px] bg-muted/20 animate-pulse rounded-xl" />}>
          <BusinessWorldNews />
        </Suspense>
      </section>

      {/* Technology Section - Grid Layout */}
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 pb-2 border-b border-border">
          Technology
        </h2>
        <CategorySection
          category="technology"
          template={NewsCard}
          variant="grid"
          limit={6}
        />
      </section>

      {/* Sports Section - Small Grid */}
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 pb-2 border-b border-border">
          Sports
        </h2>
        <CategorySection
          category="sports"
          template={NewsCard}
          variant="small"
          limit={4}
        />
      </section>
    </div>
  );
}