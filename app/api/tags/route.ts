// app/api/tags/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { news, news_tags, tags, news_categories, categories } from '@/db/schema';
import { and, count, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit')) || 20;
    const days = Number(searchParams.get('days')) || 1;

    const date = new Date();
    date.setDate(date.getDate() - days);

    const trendingTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        count: count(news_tags.tag_id).as('count'),
      })
      .from(tags)
      .innerJoin(news_tags, eq(tags.id, news_tags.tag_id))
      .innerJoin(news, eq(news_tags.news_id, news.id))
      .leftJoin(news_categories, eq(news.id, news_categories.news_id))
      .leftJoin(categories, eq(news_categories.category_id, categories.id))
      .where(
        and(
          inArray(categories.slug, ['turkiye', 'world', 'business']),
          gte(news.published_at, date)
        )
      )
      .groupBy(tags.id, tags.name, tags.slug)
      .orderBy(desc(sql`count`))
      .limit(limit);

    return NextResponse.json(trendingTags);
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tags' },
      { status: 500 }
    );
  }
}