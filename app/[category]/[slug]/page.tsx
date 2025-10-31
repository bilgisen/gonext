'use client';

import { useQuery } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { NewsArticle } from './NewsArticle';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { NewsCard } from '@/app/[category]/NewsCard';

function fetchRelatedNews(currentSlug: string, limit: number = 4) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const apiUrl = `${baseUrl}/api/news/related?for=${currentSlug}&limit=${limit}`;

  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch related news');
      }
      return response.json();
    })
    .then(result => result.data);
}

async function fetchNewsItem(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const apiUrl = `${baseUrl}/api/news/${slug}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch news item');
  }

  const result = await response.json();
  return result.data;
}

export default function SingleNewsPage() {
  const params = useParams<{ category: string; slug: string }>();
  const slug = params.slug;
  
  if (!slug) {
    notFound();
  }

  const { data: newsItem, isLoading, isError } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => fetchNewsItem(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Transform related news API response to NewsItem format for NewsCard
  const transformRelatedNews = (apiNews: any[]): any[] => {
    return apiNews.map(item => ({
      id: item.id.toString(),
      source_guid: '',
      source_id: '',
      seo_title: item.seo_title || item.title,
      seo_description: item.seo_description || item.excerpt || '',
      tldr: [],
      content_md: '',
      category: params.category || 'general',
      tags: [],
      image: item.image, // Now includes actual image data from API
      image_title: item.image_title,
      image_desc: '',
      original_url: '',
      file_path: '',
      created_at: item.published_at || new Date().toISOString(),
      published_at: item.published_at || new Date().toISOString(),
      updated_at: item.published_at || new Date().toISOString(),
      slug: item.slug,
      read_time: item.reading_time_min || undefined,
      is_bookmarked: false,
    }));
  };

  // Fetch related news
  const { data: relatedNews } = useQuery({
    queryKey: ['related-news', slug],
    queryFn: () => fetchRelatedNews(slug, 4),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const relatedNewsItems = relatedNews ? transformRelatedNews(relatedNews) : [];


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading news...</p>
        </div>
      </div>
    );
  }

  if (isError || !newsItem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">News Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The news you&apos;re looking for doesn&apos;t exist or an error occurred.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-blue-500 hover:text-blue-600 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="hidden sm:block md:block">
        <Breadcrumb
          items={[
            { href: '/', label: 'Home' },
            { href: `/${params.category}`, label: params.category || 'Category' },
            { label: newsItem.seo_title || 'Article' }
          ]}
        />
      </div>
      <NewsArticle newsItem={newsItem} />

      {/* Related News Section */}
      {relatedNewsItems.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Related News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedNewsItems.map((relatedItem) => (
              <NewsCard
                key={relatedItem.id}
                news={relatedItem}
                showCategory={true}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}