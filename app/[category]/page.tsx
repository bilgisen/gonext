import { Metadata } from 'next';
import { Suspense } from 'react';
import { CategoryNewsList } from './CategoryNewsList';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | {
    [key: string]: string | string[] | undefined;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const formatted = category.charAt(0).toUpperCase() + category.slice(1);

  return {
    title: `${formatted} News | Latest ${formatted} Updates`,
    description: `Latest ${formatted} news and updates.`,
    openGraph: { title: `${formatted} News`, description: `${formatted} updates` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const query = await searchParams;

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2 capitalize">{category} News</h1>
        <p className="text-gray-500">Stay updated with the latest in {category}</p>
      </header>

      <Suspense fallback={<SkeletonGrid />}>
        <CategoryNewsList category={category} searchParams={query} />
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
