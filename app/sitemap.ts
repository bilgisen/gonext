import { MetadataRoute } from 'next';
import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, eq, isNotNull } from 'drizzle-orm';

// Helper function to get all published news articles
async function getAllNewsForSitemap() {
  try {
    const allNews = await db
      .select({
        slug: news.slug,
        updated_at: news.updated_at,
        published_at: news.published_at,
      })
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          eq(news.visibility, 'public'),
          isNotNull(news.published_at)
        )
      );
    
    return allNews;
  } catch (error) {
    console.error('Error fetching news for sitemap:', error);
    return [];
  }
}

// This is the main sitemap for static pages and dynamic content
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const currentDate = new Date().toISOString();

  // Get all published news articles
  const newsArticles = await getAllNewsForSitemap();
  
  // Static pages
  const staticPages = [
    // Homepage
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // News listing page
    {
      url: `${baseUrl}/news`,
      lastModified: currentDate,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    // Category pages (example)
    ...['politics', 'technology', 'sports', 'entertainment', 'business'].map(category => ({
      url: `${baseUrl}/${category}`,
      lastModified: currentDate,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
    // Other important pages
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Add news articles to sitemap
  const newsPages = newsArticles.map(article => ({
    url: `${baseUrl}/haber/${article.slug}`,
    lastModified: article.updated_at || article.published_at || currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...newsPages,
  ];
}
