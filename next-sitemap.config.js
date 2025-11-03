/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  autoLastmod: true,
  
  // Exclude dynamic routes and API routes
  exclude: [
    '/admin/*',
    '/api/*',
    '/_error',
    '/_error/*',
    '/404',
    '/500',
    '/sitemap-news.xml', // We'll handle this separately
  ],
  
  // Generate a sitemap index that references both sitemaps
  generateIndexSitemap: true,
  
  // Additional sitemaps to include in the sitemap index
  additionalSitemaps: [
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app'}/sitemap-news.xml`,
  ],
  
  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: ['/admin', '/api'],
      },
    ],
    additionalSitemaps: [
      // Main sitemap (handled by Next.js app router)
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/sitemap.xml`,
      // News sitemap (handled by our API route)
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/api/sitemap/news`,
    ],
  },
};

export default config;
