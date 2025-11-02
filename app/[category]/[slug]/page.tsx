import { Metadata } from 'next';
import { NewsArticle } from './NewsArticle';
import { NewsItem } from '@/types/news';
import { getFrontPageHeadlines } from '@/lib/headline-fetching';
import FrontPageSections from '@/components/frontPageSections';


/**
 * Fetches a single news item by slug
 */
async function getNewsItem(slug: string | undefined): Promise<NewsItem | null> {
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

/**
 * JSON-LD component for structured data
 * Bu component artık burada tanımlanıyor.
 */
function JsonLd({ newsItem }: { newsItem: NewsItem }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app';
  const url = `${siteUrl}/${newsItem.category}/${newsItem.slug}`;
  const imageUrl = newsItem.image ?
    `${siteUrl}${newsItem.image.startsWith('/') ? '' : '/'}${newsItem.image}` : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: newsItem.seo_title || newsItem.title || '',
    description: newsItem.seo_description || newsItem.excerpt || '',
    image: imageUrl ? [imageUrl] : [],
    datePublished: newsItem.published_at || new Date().toISOString(),
    dateModified: newsItem.updated_at || new Date().toISOString(),
    author: [{
      '@type': 'Person',
      name: newsItem.author || 'NewsTR',
      url: siteUrl,
    }],
    publisher: {
      '@type': 'Organization',
      name: 'NewsTR',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: newsItem.category,
    keywords: Array.isArray(newsItem.tags) ? newsItem.tags.join(', ') : '',
    wordCount: newsItem.content_md?.length || 0,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      key="news-jsonld"
    />
  );
}

interface PageProps {
  params: Promise<{ category: string; slug: string }>; // params artık Promise
  searchParams?: { [key: string]: string | string[] | undefined };
}

// generateMetadata fonksiyonu async olmalı ve params'ı await etmelidir
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  // props.params Promise olduğu için onu await ediyoruz
  const params = await props.params;
  const { slug } = params; // Artık doğrudan erişebiliriz

  const newsItem = await getNewsItem(slug);

  if (!newsItem) {
    return {
      title: 'News Not Found',
      description: 'The requested news article could not be found.',
    };
  }

  const { title, seo_title, seo_description, excerpt, image, published_at, updated_at, tags = [] } = newsItem;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app';
  const imageUrl = image ? `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}` : '';

  return {
    title: seo_title || title,
    description: seo_description || excerpt,
    keywords: tags.join(', '),
    authors: [{ name: newsItem.author || 'NewsTR' }],
    openGraph: {
      title: seo_title || title,
      description: seo_description || excerpt,
      images: imageUrl ? [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: newsItem.seo_title || newsItem.title || ''
      }] : [],
      type: 'article',
      publishedTime: published_at,
      modifiedTime: updated_at,
      authors: [newsItem.author || 'NewsTR'],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo_title || title,
      description: seo_description || excerpt,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// Page fonksiyonu async olmalı ve params'ı await etmelidir
export default async function Page(props: PageProps) {
  // props.params Promise olduğu için onu await ediyoruz
  const params = await props.params;
  const { slug } = params; // Artık doğrudan erişebiliriz

  const newsItem = await getNewsItem(slug);

  if (!newsItem) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">News Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested news article could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  // Fetch headlines data for the widget
  await getFrontPageHeadlines();

  return (
    <>
      <JsonLd newsItem={newsItem} />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8 space-y-12">
          {/* Main Article */}
          <section>
            <NewsArticle newsItem={newsItem} />
          </section>

          {/* Widget Section */}
          <section className="mt-12">
            <FrontPageSections
              categories={['turkiye', 'business', 'world', 'technology', 'sports', 'culture']}
              layout={['a', 'c']}
              offset={[0, 0]}
            />
          </section>
        </div>
      </main>
    </>
  );
}
