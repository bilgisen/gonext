// app/api/user/bookmarks/route.ts
import { db } from '@/db';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { news_bookmarks, news, media } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const result = await auth.api.getSession({
      headers: new Headers(request.headers)
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const bookmarks = await db
      .select({
        id: news_bookmarks.id,
        created_at: news_bookmarks.created_at,
        news: {
          id: news.id,
          title: news.title,
          excerpt: news.excerpt,
          slug: news.slug,
          published_at: news.published_at,
          main_media_id: news.main_media_id,
          media_id: media.id,
          media_url: media.external_url,
          media_alt: media.alt_text,
          media_width: media.width,
          media_height: media.height
        }
      })
      .from(news_bookmarks)
      .innerJoin(news, eq(news_bookmarks.news_id, news.id))
      .leftJoin(media, eq(news.main_media_id, media.id))
      .where(eq(news_bookmarks.user_id, result.session.userId))
      .orderBy(desc(news_bookmarks.created_at))
      .limit(isNaN(limit) ? 10 : Math.min(limit, 50));

    // Transform the data to the desired format
    const formattedBookmarks = bookmarks.map(bookmark => {
      // Extract just the path from the URL if it contains 'undefined.netlify.app'
      let mediaUrl = bookmark.news.media_url;
      if (mediaUrl?.includes('undefined.netlify.app')) {
        const url = new URL(mediaUrl);
        mediaUrl = url.pathname; // This will give us the path like '/.netlify/blobs/...'
      }

      return {
        ...bookmark,
        news: {
          ...bookmark.news,
          main_media: bookmark.news.media_id ? {
            id: bookmark.news.media_id,
            url: mediaUrl,
            alt: bookmark.news.media_alt,
            width: bookmark.news.media_width,
            height: bookmark.news.media_height
          } : null
        }
      };
    });

    // Remove the temporary fields we added
    const finalBookmarks = formattedBookmarks.map(({ news: { media_id, media_url, media_alt, media_width, media_height, ...restNews }, ...rest }) => ({
      ...rest,
      news: restNews
    }));

    return NextResponse.json({ bookmarks: finalBookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}