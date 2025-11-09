// components/frontPageSections.tsx
import { cn } from '@/lib/utils';
import NewsLayout from './cards/NewsLayout';
import type { NewsItem } from '@/types/news';

async function getNewsData(category: string, limit = 3) {
  const params = new URLSearchParams({
    category: category.toLowerCase() === 'türkiye' ? 'turkiye' : category.toLowerCase(),
    limit: String(limit),
    sort: 'newest',
  });

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/news?${params}`, {
    next: { revalidate: 180 }, // 3 dakikada bir yenile
    cache: 'force-cache', // SSR cache'i agresif kullan
  });

  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.items || [];
}

function CategoryBlock({
  items,
  category,
  layoutVariant,
  className,
}: {
  items: NewsItem[];
  category: string;
  layoutVariant: 'a' | 'b';
  className?: string;
}) {
  if (!items?.length) {
    return (
      <div className={cn('p-4 bg-destructive/10 text-destructive rounded-md', className)}>
        No news available for {category}.
      </div>
    );
  }

  // Ensure we have at least 3 items (1 main + 2 side)
  const safeItems = [...items];
  while (safeItems.length < 3) {
    safeItems.push({
      id: `placeholder-${safeItems.length}`,
      source_id: '',
      source_guid: '',
      title: 'No news available',
      slug: '',
      excerpt: 'Check back later for updates',
      content: '',
      seo_title: 'No news available',
      seo_description: 'No news items are currently available',
      status: 'published',
      featured: false,
      view_count: 0,
      read_time: 0,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: '',
      image_alt: '',
      image_caption: '',
      author_id: null,
      source_url: null,
      categories: [],
      tags: [],
      meta: {},
      image: '',
      category: category.toLowerCase(),
      tldr: [],
      original_url: '',
      file_path: '',
      is_bookmarked: false
    } as NewsItem);
  }

  const [main, ...side] = safeItems;
  
  return (
    <div className={cn('space-y-6', className)}>
      <NewsLayout 
        mainNews={main} 
        sideNews={[side[0], side[1] || side[0]]} 
        variant={layoutVariant} 
      />
    </div>
  );
}

export default async function FrontPageSections({
  categories,
  layout = 'a',
  limit = 3,
  className,
}: {
  categories: string[];
  layout?: 'a' | 'b' | ('a' | 'b')[];
  limit?: number;
  className?: string;
}) {
  // 🔹 Tüm kategorileri paralel olarak çek
  const newsResults = await Promise.all(categories.map(c => getNewsData(c, limit)));

  const getLayoutVariant = (index: number): 'a' | 'b' => {
    if (Array.isArray(layout)) return layout[index % layout.length] || 'a';
    return layout;
  };

  return (
    <div className="space-y-12">
      {categories.map((category, index) => (
        <div key={category} className="space-y-8">
          <CategoryBlock
            items={newsResults[index]}
            category={category}
            layoutVariant={getLayoutVariant(index)}
            className={className}
          />

        </div>
      ))}
    </div>
  );
}
