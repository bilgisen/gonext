import { NewsItem } from '@/types/news';

/**
 * Fetches a single news item by slug
 */
export async function getNewsItem(slug: string | undefined): Promise<NewsItem | null> {
  if (!slug) {
    console.error('❌ No slug provided to getNewsItem');
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app';
    const apiUrl = `${baseUrl}/api/news/${encodeURIComponent(slug)}`;
    
    console.log(`🔍 Fetching news item from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 60, // Revalidate every 60 seconds
        tags: [`news:${slug}`] // Invalidate cache when needed
      }
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.error(`❌ News item not found for slug: ${slug}`);
        return null;
      }
      const errorText = await response.text();
      console.error(`❌ Failed to fetch news item: ${response.status} ${response.statusText}`, {
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return null;
    }

    const result = await response.json();
    
    if (!result?.data) {
      console.error('❌ Invalid response format from API:', result);
      return null;
    }
    
    // Ensure we have a title by falling back to seo_title or a default
    const newsItem = {
      ...result.data,
      title: result.data.title || result.data.seo_title || 'News Article'
    };
    
    console.log('✅ Successfully fetched news item:', {
      id: newsItem.id,
      slug: newsItem.slug,
      title: newsItem.title,
      seo_title: newsItem.seo_title
    });
    
    return newsItem as NewsItem;
  } catch (error) {
    console.error('❌ Error in getNewsItem:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug,
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
