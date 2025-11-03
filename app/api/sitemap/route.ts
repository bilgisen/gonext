import { getServerSideSitemap } from 'next-sitemap';
import { NextRequest } from 'next/server';
import { 
  getAllNewsForSitemap,
  generateNewsSitemapFields,
  type SitemapField
} from '@/lib/news-sitemap.utils';

// List of static pages to include in sitemap
const staticPages: SitemapField[] = [
  { 
    loc: '/', 
    lastmod: new Date().toISOString(), 
    changefreq: 'daily', 
    priority: 1.0 
  },
  { 
    loc: '/haberler', 
    lastmod: new Date().toISOString(), 
    changefreq: 'hourly', 
    priority: 0.9 
  },
  // Add more static pages as needed
];

// Main sitemap with all published news
export async function GET(_request: NextRequest) {
  try {
    // Get all published news using our helper
    const news = await getAllNewsForSitemap();
    
    // Generate sitemap fields using our helper
    const newsFields = generateNewsSitemapFields(news);

    // Combine with static pages
    const allFields: SitemapField[] = [
      ...staticPages.map((page) => ({
        ...page,
        loc: `https://example.com${page.loc}`,
      })),
      ...newsFields,
    ];

    return getServerSideSitemap(allFields);
  } catch (e) {
    console.error('Sitemap generation error:', e);
    return new Response(JSON.stringify({ error: 'Error generating sitemap' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Prevent caching the response
export const dynamic = 'force-dynamic';

// Add CORS headers if needed
export const cors = {
  'Access-Control-Allow-Origin': '*',
};
