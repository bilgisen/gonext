'use client';

import dynamic from 'next/dynamic';

// Lazy load the client component
const FrontCardLayoutTwo = dynamic(
  () => import('@/components/front-category/front-card-layout-two'),
  { 
    ssr: false, 
    loading: () => <div className="h-40 bg-muted animate-pulse rounded" /> 
  }
);

interface FrontPageSectionsProps {
  categories: string[];
}

export function FrontPageSections({ categories }: FrontPageSectionsProps) {
  return (
    <section className="space-y-12">
      {categories.map((cat) => (
        <div key={cat} className="space-y-4">
          <h3 className="text-2xl font-semibold capitalize">{cat}</h3>
          <FrontCardLayoutTwo category={cat} limit={5} offset={1} />
        </div>
      ))}
    </section>
  );
}
