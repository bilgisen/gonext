import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { news, news_categories, categories, media } from '@/db/schema';
import { eq, and, not, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentSlug = searchParams.get('for');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!currentSlug) {
      return NextResponse.json(
        { success: false, error: 'News slug is required (use ?for=news-slug)' },
        { status: 400 }
      );
    }

    // First, get the current news item and its category
    const [currentNews] = await db
      .select({
        id: news.id,
        categoryId: news_categories.category_id,
        categoryName: categories.name,
        categorySlug: categories.slug
      })
      .from(news)
      .innerJoin(news_categories, eq(news.id, news_categories.news_id))
      .innerJoin(categories, eq(news_categories.category_id, categories.id))
      .where(eq(news.slug, currentSlug))
      .limit(1);

    if (!currentNews) {
      return NextResponse.json(
        { success: false, error: 'News item not found' },
        { status: 404 }
      );
    }

    // Get related news from the same category, excluding current item
    const dbRelatedNews = await db
      .select()
      .from(news)
      .innerJoin(news_categories, eq(news.id, news_categories.news_id))
      .where(and(
        eq(news_categories.category_id, currentNews.categoryId),
        not(eq(news.slug, currentSlug)),
        eq(news.status, 'published')
      ))
      .orderBy(desc(news.published_at))
      .limit(limit);

    // Transform to include image data
    const relatedNews = await Promise.all(
      dbRelatedNews.map(async (dbNews) => {
        // Get main image if exists
        let image = '';
        let imageTitle = '';
        if (dbNews.news.main_media_id) {
          const mediaResult = await db
            .select()
            .from(media)
            .where(eq(media.id, dbNews.news.main_media_id))
            .limit(1);

          if (mediaResult.length > 0) {
            image = mediaResult[0].external_url || mediaResult[0].storage_path || '';
            imageTitle = mediaResult[0].alt_text || mediaResult[0].caption || '';
          }
        }

        return {
          id: dbNews.news.id,
          title: dbNews.news.title,
          slug: dbNews.news.slug,
          excerpt: dbNews.news.excerpt,
          seo_title: dbNews.news.seo_title,
          seo_description: dbNews.news.seo_description,
          image: image,
          image_title: imageTitle,
          main_media_id: dbNews.news.main_media_id,
          published_at: dbNews.news.published_at,
          reading_time_min: dbNews.news.reading_time_min,
          word_count: dbNews.news.word_count,
          status: dbNews.news.status
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: relatedNews,
      meta: {
        currentNews: {
          id: currentNews.id,
          slug: currentSlug,
          category: currentNews.categoryName,
          categorySlug: currentNews.categorySlug
        },
        requestedLimit: limit,
        returnedCount: relatedNews.length
      }
    });
  } catch (error) {
    console.error('Error fetching related news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related news' },
      { status: 500 }
    );
  }
}
