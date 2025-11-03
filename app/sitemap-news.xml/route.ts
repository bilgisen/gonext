import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, gte, desc, isNotNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { format } from 'date-fns';

type NewsSitemapEntry = {
  loc: string;
  lastmod: string;
  news: {
    publication: {
      name: string;
      language: string;
    };
    publication_date: string;
    title: string;
  };
};

export async function GET(_request: NextRequest) {
  try {
    // Calculate date 2 days ago for Google News requirements
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Fetch recent news articles (last 2 days)
    const recentNews = await db
      .select()
      .from(news)
      .where(
        and(
          isNotNull(news.published_at),
          gte(news.published_at, twoDaysAgo)
        )
      )
      .orderBy(desc(news.published_at))
      .limit(1000); // Google News limit per sitemap

    // Generate the sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
  ${recentNews.map(article => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/haber/${article.slug}`;
    const pubDate = article.published_at || new Date();
    const lastMod = article.updated_at || pubDate;
    
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${format(new Date(lastMod), 'yyyy-MM-dd')}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${process.env.NEXT_PUBLIC_SITE_NAME || 'Your Site Name'}</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${format(new Date(pubDate), 'yyyy-MM-dd')}</news:publication_date>
      <news:title>${article.title || ''}</news:title>
    </news:news>
  </url>`;
  }).join('')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml' },
      }
    );
  }
}

// Prevent caching the response
export const dynamic = 'force-dynamic';

// Add CORS headers
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
};
