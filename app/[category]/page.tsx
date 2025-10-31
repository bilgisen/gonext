import { Metadata } from 'next';
import { Suspense } from 'react';
import { CategoryNewsList } from './CategoryNewsList';
import { getDisplayName } from '@/lib/utils/category-utils';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | {
    [key: string]: string | string[] | undefined;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: urlSlug } = await params;
  const normalizedSlug = urlSlug.toLowerCase();
  const displayName = getDisplayName(normalizedSlug);

  return {
    title: `${displayName} News | Latest ${displayName} Updates`,
    description: `Latest ${displayName} news and updates.`,
    openGraph: { 
      title: `${displayName} News`, 
      description: `${displayName} updates` 
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: urlSlug } = await params;
  const query = await searchParams;
  
  // Ensure the URL slug is in lowercase and normalized
  const normalizedSlug = urlSlug.toLowerCase();
  
  // Get the display name for the category
  const displayName = getDisplayName(normalizedSlug);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">{displayName} News</h1>
        <p className="text-gray-500">Stay updated with the latest in {displayName}</p>
      </header>

      <Suspense fallback={<SkeletonGrid />}>
        {/* Pass the normalized slug to CategoryNewsList to maintain consistent URLs */}
        <CategoryNewsList category={normalizedSlug} searchParams={query} />
      </Suspense>
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
