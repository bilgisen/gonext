// app/api/news/[id]/bookmark/route.ts
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { news_bookmarks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params bir Promise
) {
  try {
    // params nesnesini await et
    const resolvedParams = await params;

    const result = await auth.api.getSession({
      headers: new Headers(request.headers)
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const newsId = parseInt(resolvedParams.id, 10); // resolvedParams üzerinden alınmalı
    if (isNaN(newsId)) {
      return NextResponse.json(
        { error: 'Invalid news ID' },
        { status: 400 }
      );
    }

    const bookmark = await db.query.news_bookmarks.findFirst({
      where: and(
        eq(news_bookmarks.news_id, newsId),
        eq(news_bookmarks.user_id, result.session.userId)
      )
    });

    return NextResponse.json({
      bookmarked: !!bookmark
    });

  } catch (error) {
    console.error('Bookmark check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params bir Promise
) {
  try {
    // params nesnesini await et
    const resolvedParams = await params;

    const result = await auth.api.getSession({
      headers: new Headers(request.headers)
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const newsId = parseInt(resolvedParams.id, 10); // resolvedParams üzerinden alınmalı
    if (isNaN(newsId)) {
      return NextResponse.json(
        { error: 'Invalid news ID' },
        { status: 400 }
      );
    }

    const existing = await db.query.news_bookmarks.findFirst({
      where: and(
        eq(news_bookmarks.news_id, newsId),
        eq(news_bookmarks.user_id, result.session.userId)
      )
    });

    if (existing) {
      await db
        .delete(news_bookmarks)
        .where(
          and(
            eq(news_bookmarks.news_id, newsId),
            eq(news_bookmarks.user_id, result.session.userId)
          )
        );
      return NextResponse.json({ bookmarked: false });
    } else {
      await db.insert(news_bookmarks).values({
        news_id: newsId,
        user_id: result.session.userId
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}