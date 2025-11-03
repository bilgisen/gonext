import { MetadataRoute } from 'next';

// This is the main sitemap for static pages
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const currentDate = new Date().toISOString();

  return [
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
}
