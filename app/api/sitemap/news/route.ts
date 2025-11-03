import { getServerSideSitemap, ISitemapField } from 'next-sitemap';
import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { and, gte, desc, eq } from 'drizzle-orm';
import { news } from '@/db/schema';

type NewsWithTags = {
  slug: string;
  published_at: Date | null;
  updated_at: Date | null;
  title: string;
  tags?: string[];
  meta?: unknown;
};

// Helper to get recent news for Google News sitemap (last 2 days)
async function getRecentNews(): Promise<NewsWithTags[]> {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const results = await db
    .select({
      slug: news.slug,
      published_at: news.published_at,
      updated_at: news.updated_at,
      title: news.title,
      meta: news.meta
    })
    .from(news)
    .where(
      and(
        gte(news.published_at, twoDaysAgo),
        eq(news.status, 'published')
      )
    )
    .orderBy(desc(news.published_at))
    .limit(1000); // Google News limit per sitemap

  return results.map(item => {
    const meta = item.meta as { tags?: string[] } | null;
    return {
      ...item,
      tags: meta?.tags
    };
  });
}

export async function GET(_request: NextRequest) {
  try {
    // Get recent news (last 2 days)
    const recentNews = await getRecentNews();
    
    // Transform to Google News sitemap format
    const newsEntries = recentNews.map((article) => {
      // Create the base entry
      const entry: ISitemapField = {
        loc: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/news/${article.slug}`,
        lastmod: (article.updated_at || article.published_at)?.toISOString() || new Date().toISOString(),
        changefreq: 'hourly',
        priority: 0.9,
        // Add news-specific fields
        news: {
          title: article.title,
          date: (article.published_at || new Date()).toISOString(),
          publicationName: 'Your News Site', // TODO: Replace with your site name
          publicationLanguage: 'en',
          // Add keywords if available
          ...(article.tags?.length ? { keywords: article.tags.join(', ') } : {})
        }
      };

      // Ensure news property exists
      if (!entry.news) {
        entry.news = {
          title: article.title,
          date: (article.published_at || new Date()).toISOString(),
          publicationName: 'Your News Site',
          publicationLanguage: 'en'
        };
      }

      return entry;
    });

    // Generate the sitemap with proper type assertion
    return getServerSideSitemap(newsEntries as ISitemapField[]);
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    // Return empty sitemap on error with proper type assertion
    return getServerSideSitemap([] as ISitemapField[]);
  }
}

// Prevent caching the response
export const dynamic = 'force-dynamic';

// Add CORS headers if needed
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
};
