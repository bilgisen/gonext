// lib/news-metadata.ts
import { NewsItem } from '@/types/news';

// Base URL for the website
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

/**
 * Generates standard metadata for a news article
 */
export function generateNewsMetadata(newsItem: NewsItem) {
  const { 
    seo_title, 
    seo_description, 
    tags = [],  // According to NewsItem type, tags is string[]
    published_at, 
    updated_at,
  } = newsItem;

  // Ensure tags is an array and filter out any empty strings
  const validTags = Array.isArray(tags) 
    ? tags.filter((tag): tag is string => Boolean(tag && typeof tag === 'string'))
    : [];

  // Create a comma-separated list of unique tags for keywords
  const keywords = [...new Set(validTags)].join(', ');
  
  return {
    title: seo_title,
    description: seo_description,
    keywords: keywords,
    // Add other standard metadata
    robots: 'index, follow',
    author: 'Your News Organization',
    // Format: 2023-01-01T00:00:00+00:00
    publication_date: published_at ? new Date(published_at).toISOString() : undefined,
    modification_date: updated_at ? new Date(updated_at).toISOString() : undefined,
  };
}

/**
 * Generates OpenGraph metadata for social sharing
 */
export function generateOpenGraphMetadata(newsItem: NewsItem) {
  const { seo_title, seo_description, image, published_at, updated_at } = newsItem;
  const imageUrl = getOptimizedImageUrl(image, { width: 1200, height: 630 });
  
  return {
    'og:title': seo_title,
    'og:description': seo_description,
    'og:image': imageUrl,
    'og:url': getCanonicalUrl(newsItem),
    'og:type': 'article',
    'og:site_name': 'Your News Site',
    'og:locale': 'en_US',
    
    // Article specific
    'article:published_time': published_at ? new Date(published_at).toISOString() : undefined,
    'article:modified_time': updated_at ? new Date(updated_at).toISOString() : undefined,
    'article:author': 'Your News Organization',
    'article:section': newsItem.category,
    'article:tag': newsItem.tags,
  };
}

/**
 * Generates Twitter Card metadata
 */
export function generateTwitterCardMetadata(newsItem: NewsItem) {
  const { seo_title, seo_description, image } = newsItem;
  const imageUrl = getOptimizedImageUrl(image, { 
    width: 1200, 
    height: 628,
    format: 'jpg'
  });
  
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': seo_title,
    'twitter:description': seo_description,
    'twitter:image': imageUrl,
    'twitter:url': getCanonicalUrl(newsItem),
    'twitter:site': '@yourtwitterhandle',
    'twitter:creator': '@authorhandle',
  };
}

/**
 * Generates JSON-LD structured data for search engines
 */
export function generateJsonLd(newsItem: NewsItem) {
  const { 
    seo_title, 
    seo_description, 
    image, 
    published_at, 
    updated_at,
    read_time,
    category,
    tags = []
  } = newsItem;
  
  const imageUrl = getOptimizedImageUrl(image, { width: 1200 });
  
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: seo_title,
    description: seo_description,
    image: imageUrl ? [imageUrl] : [],
    datePublished: published_at ? new Date(published_at).toISOString() : undefined,
    dateModified: updated_at ? new Date(updated_at).toISOString() : undefined,
    author: {
      '@type': 'Organization',
      name: 'Your News Organization',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'Your News Organization',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(newsItem)
    },
    articleSection: category,
    keywords: tags.join(', '),
    wordCount: seo_description?.length || 0,
    timeRequired: read_time ? `PT${read_time}M` : undefined
  };
}

/**
 * Helper to get optimized image URL using the /api/images/[key] endpoint
 * Always returns absolute URLs for use in metadata
 */
function getOptimizedImageUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'avif' | 'jpeg';
  } = {}
): string {
  if (!imageUrl) return '';
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // If it's a blob: URL, extract the key and create API URL
  if (imageUrl.startsWith('blob:')) {
    const blobKey = imageUrl.split('/').pop();
    if (!blobKey) return '';
    
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('fm', options.format);
    
    const path = `/api/images/${encodeURIComponent(blobKey)}${params.toString() ? `?${params.toString()}` : ''}`;
    return `${SITE_URL}${path}`;
  }
  
  // For local paths, ensure they're absolute
  return imageUrl.startsWith('/') ? `${SITE_URL}${imageUrl}` : `${SITE_URL}/${imageUrl}`;
}

/**
 * Generates the canonical URL for a news article
 */
function getCanonicalUrl(newsItem: NewsItem): string {
  return `${SITE_URL}/${newsItem.category || 'news'}/${newsItem.slug}`;
}

/**
 * Generates all metadata for a news article in a format suitable for Next.js metadata API
 */
export function generateAllMetadata(newsItem: NewsItem) {
  const standard = generateNewsMetadata(newsItem);
  const openGraph = generateOpenGraphMetadata(newsItem);
  const twitter = generateTwitterCardMetadata(newsItem);
  const jsonLd = generateJsonLd(newsItem);

  return {
    title: standard.title,
    description: standard.description,
    keywords: standard.keywords,
    openGraph: {
      ...openGraph,
      images: [
        {
          url: openGraph['og:image'] || '',
          width: 1200,
          height: 630,
          alt: newsItem.seo_title,
        },
      ],
    },
    twitter: {
      ...twitter,
      images: [twitter['twitter:image'] || ''],
    },
    other: {
      ...Object.entries(standard)
        .filter(([key]) => !['title', 'description', 'keywords'].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      'article:published_time': openGraph['article:published_time'],
      'article:modified_time': openGraph['article:modified_time'],
      'article:author': openGraph['article:author'],
      'article:section': openGraph['article:section'],
      'article:tag': openGraph['article:tag'],
    },
    jsonLd,
  };
}
