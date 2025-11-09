export interface TrendingArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
  view_count: number;
  trending_score: number;
  image_url?: string;
}

export async function fetchTrendingArticles(limit = 6) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/news/trending?limit=${limit}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error('Failed to fetch trending articles');
  const json = await res.json();
  return json.data as TrendingArticle[];
}
