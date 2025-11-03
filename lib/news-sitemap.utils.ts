// lib/news-sitemap.utils.ts
import { db } from '@/db/client';
import { and, gte, desc, eq, isNotNull } from 'drizzle-orm';
import { news } from '@/db/schema';


// Base URL for the website
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

type NewsArticle = {
  slug: string;
  published_at: Date | null;
  updated_at: Date | null;
  title: string;
};

/**
 * Fetches all published news articles for sitemap
 */
export async function getAllNewsForSitemap(): Promise<NewsArticle[]> {
  try {
    return await db
      .select({
        slug: news.slug,
        published_at: news.published_at,
        updated_at: news.updated_at,
        title: news.title,
      })
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          eq(news.visibility, 'public'),
          isNotNull(news.published_at)
        )
      )
      .orderBy(desc(news.published_at));
  } catch (error) {
    console.error('Error fetching news for sitemap:', error);
    return [];
  }
}

/**
 * Fetches recent news articles for Google News sitemap (last 2 days)
 */
export async function getRecentNewsForSitemap(days = 2): Promise<NewsArticle[]> {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - days);

    return await db
      .select({
        slug: news.slug,
        published_at: news.published_at,
        updated_at: news.updated_at,
        title: news.title,
      })
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          eq(news.visibility, 'public'),
          isNotNull(news.published_at),
          gte(news.published_at, twoDaysAgo)
        )
      )
      .orderBy(desc(news.published_at));
  } catch (error) {
    console.error('Error fetching recent news for sitemap:', error);
    return [];
  }
}

// Define our own Changefreq type to match next-sitemap's expected values
type Changefreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export type SitemapField = {
  loc: string;
  lastmod: string;
  changefreq?: Changefreq;
  priority?: number;
};

/**
 * Generates sitemap fields for news articles
 */
export function generateNewsSitemapFields(articles: NewsArticle[]): SitemapField[] {
  return articles.map((article) => ({
    loc: `${SITE_URL}/haber/${article.slug}`,
    lastmod: article.updated_at?.toISOString() || article.published_at?.toISOString() || new Date().toISOString(),
    changefreq: 'daily',
    priority: 0.8,
  }));
}

/**
 * Generates Google News sitemap fields
 */
export function generateGoogleNewsSitemapFields(articles: NewsArticle[]): Array<{
  loc: string;
  lastmod: string;
  news: {
    title: string;
    publication: {
      name: string;
      language: string;
    };
    publication_date: string;
  };
}> {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Your News Site';
  
  return articles.map((article) => ({
    loc: `${SITE_URL}/haber/${article.slug}`,
    lastmod: article.updated_at?.toISOString() || article.published_at?.toISOString() || new Date().toISOString(),
    news: {
      title: article.title,
      publication: {
        name: siteName,
        language: 'tr',
      },
      publication_date: (article.published_at || new Date()).toISOString(),
    },
  }));
}
