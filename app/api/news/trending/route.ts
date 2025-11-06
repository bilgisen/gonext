// app/api/news/trending/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { db } from '@/db';
import { sql, inArray } from 'drizzle-orm';
import { news } from '@/db/schema'; // news tablosunun şemasını import edin

export const dynamic = 'force-dynamic';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string; // DB'den string olarak gelir
  created_at: string;   // DB'den string olarak gelir
  meta: Record<string, any> | null; // veya uygun bir tip
  view_count: number;
  trending_score: number;
  image_url?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'daily';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);

  try {
    let trending: string[] = [];
    try {
      trending = await redis.zrevrange(
        `trending:${period}`,
        0,
        limit - 1,
        'WITHSCORES'
      );
    } catch (redisError) {
      console.error('Redis error:', redisError);
    }

    if (trending.length === 0) {
      try {
        const result = await db.execute(sql`
          SELECT 
            n.id, 
            n.title, 
            n.slug, 
            n.excerpt, 
            n.published_at, 
            n.created_at,
            n.meta,
            n.view_count
          FROM news n
          WHERE n.status = 'published'
            AND n.published_at >= NOW() - INTERVAL '7 days'
          ORDER BY n.view_count DESC, n.published_at DESC
          LIMIT ${limit}
        `);
        
        const articles = result.rows.map(article => ({
          ...article,
          // Tarihler zaten string olarak gelmeli, Number'a gerek yok
          view_count: Number(article.view_count) || 0,
          trending_score: 0
        }));
        
        return NextResponse.json({ 
          data: articles,
          source: 'database-fallback',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Database error during fallback:', error);
        return NextResponse.json({ 
          data: [],
          message: 'Failed to fetch trending articles',
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'database-error'
        }, { status: 500 });
      }
    }

    const articleIds: number[] = [];
    const scores = new Map<number, number>();

    for (let i = 0; i < trending.length; i += 2) {
      const articleId = parseInt(trending[i], 10);
      const score = parseFloat(trending[i + 1]);
      if (!isNaN(articleId) && !isNaN(score)) {
        articleIds.push(articleId);
        scores.set(articleId, score);
      }
    }

    if (articleIds.length === 0) {
      return NextResponse.json({ 
        data: [],
        message: 'No trending articles found',
        source: 'redis-empty'
      });
    }

    try {
      // Tip güvenli select kullan
      const result = await db.select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        published_at: news.published_at,
        created_at: news.created_at,
        meta: news.meta, // Drizzle bu alanı 'unknown' olarak getirir
        view_count: news.view_count,
      }).from(news).where(inArray(news.id, articleIds));

      // Drizzle'nin döndürdüğü sonuç, Article tipiyle uyumlu hale getirilir
      const articlesWithScores: Article[] = result.map(article => {
        const redisScore = scores.get(Number(article.id)) || 0;
        // Drizzle'den gelen meta 'unknown' tipinde olabilir, güvenli bir şekilde dönüştür
        let parsedMeta: Record<string, any> | null = null;
        if (article.meta !== null && typeof article.meta === 'object') {
          parsedMeta = article.meta as Record<string, any>;
        } else if (typeof article.meta === 'string') {
          try {
            parsedMeta = JSON.parse(article.meta);
          } catch {
            // JSON.parse hatası durumunda null
            parsedMeta = null;
          }
        }

        // Drizzle'den gelen tarih alanları Date nesnesi olabilir veya string olabilir
        // Tip kontrolü yap ve uygun formatta string'e çevir
        let publishedAtStr: string;
        if (article.published_at instanceof Date) {
          publishedAtStr = article.published_at.toISOString();
        } else if (typeof article.published_at === 'string') {
          publishedAtStr = article.published_at;
        } else {
          // null veya beklenmeyen tip durumu
          publishedAtStr = new Date().toISOString(); // veya uygun bir fallback
        }

        let createdAtStr: string;
        if (article.created_at instanceof Date) {
          createdAtStr = article.created_at.toISOString();
        } else if (typeof article.created_at === 'string') {
          createdAtStr = article.created_at;
        } else {
          // null veya beklenmeyen tip durumu
          createdAtStr = new Date().toISOString(); // veya uygun bir fallback
        }

        // meta alanından image_url alınır
        const image_url = parsedMeta && typeof parsedMeta === 'object' && 'image_url' in parsedMeta
          ? (parsedMeta.image_url as string | undefined)
          : undefined;

        return {
          ...article,
          // Drizzle'den gelen tarihleri string'e dönüştür
          published_at: publishedAtStr,
          created_at: createdAtStr,
          // Drizzle'den gelen meta'yı dönüştür
          meta: parsedMeta,
          // view_count zaten number olmalı, ancak emin olmak için Number'a alınabilir
          view_count: Number(article.view_count) || 0,
          trending_score: redisScore,
          image_url, // meta'dan alınan image_url
        };
      }).sort((a, b) => b.trending_score - a.trending_score);

      return NextResponse.json({ 
          data: articlesWithScores,
          period,
          source: 'redis',
          updated_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Error fetching article details:', dbError);
      return NextResponse.json({
        data: [],
        message: 'Error fetching article details',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        source: 'database-error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Unhandled error in trending articles API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch trending articles',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'unhandled-error'
      },
      { status: 500 }
    );
  }
}