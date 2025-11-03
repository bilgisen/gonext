import { NextRequest } from 'next/server';
import { getRecentNewsForSitemap } from '@/lib/news-sitemap.utils';

// Base URL for the website
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'NewsTR';

export async function GET(_request: NextRequest) {
  try {
    console.log('Sitemap generation started at:', new Date().toISOString());
    console.log('Using SITE_URL:', SITE_URL);
    console.log('Using SITE_NAME:', SITE_NAME);
    
    // Get recent news articles (last 2 days by default)
    const recentNews = await getRecentNewsForSitemap(2);
    
    console.log(`Found ${recentNews.length} recent news articles`);
    if (recentNews.length > 0) {
      console.log('Sample news article:', {
        title: recentNews[0].title,
        slug: recentNews[0].slug,
        published_at: recentNews[0].published_at,
        updated_at: recentNews[0].updated_at
      });
    }

    // Helper function to escape XML special characters
    const escapeXml = (unsafe: string): string => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Generate the sitemap XML
    const urlEntries = recentNews.map(article => {
      if (!article.slug || !article.published_at) {
        console.log('Skipping article - missing required fields:', {
          slug: article.slug,
          published_at: article.published_at,
          title: article.title
        });
        return '';
      }

      const url = `${SITE_URL}/haber/${encodeURIComponent(article.slug)}`;
      const pubDate = article.published_at;
      const lastMod = article.updated_at || pubDate;
      const title = escapeXml(article.title || '');
      const pubDateFormatted = new Date(pubDate).toISOString().split('T')[0];
      const lastModFormatted = new Date(lastMod).toISOString().split('T')[0];
      
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastModFormatted}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${pubDateFormatted}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    });
    
    console.log(`Generated ${urlEntries.filter(Boolean).length} valid URL entries`);
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>${urlEntries.join('')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'x-content-type-options': 'nosniff',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    // Return an empty sitemap in case of error
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>',
      {
        status: 200, // Return 200 even on error to avoid SEO issues
        headers: { 
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300, must-revalidate',
        },
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
