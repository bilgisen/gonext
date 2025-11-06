// app/api/news/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

// Helper function to create consistent API responses
function createResponse(
  success: boolean,
  data: Record<string, any> = {},
  status: number = 200
): NextResponse {
  const response = { success, ...data };
  return NextResponse.json(response, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params bir Promise
) {
  // No need to track start time since we're not using it after commenting out the logs
  // const startTime = Date.now();
  
  // Await the params promise
  const resolvedParams = await params;

  // Extract and validate the ID parameter
  let idParam = resolvedParams.id;
  // Handle case where id might be an array (Next.js route parameter)
  const idString = Array.isArray(idParam) ? idParam[0] : idParam;

  // Validate news ID string first
  if (!idString || typeof idString !== 'string' || idString.trim() === '') {
    const error = 'Missing or invalid article ID parameter';
    // console.error(`[${requestId}] ❌ ${error}:`, { idParam, idString });
    return createResponse(false, { error }, 400);
  }

  const newsId = parseInt(idString, 10);

  // Validate parsed news ID
  if (isNaN(newsId) || newsId <= 0) {
    const error = 'Invalid news ID';
    // console.error(`[${requestId}] ❌ ${error}: params.id was "${resolvedParams.id}", parsed as "${newsId}"`);
    return createResponse(false, { error }, 400);
  }

  // console.log(`[${requestId}] ✅ Parsed newsId: ${newsId}`);

  try {
    // Get client information (not used in INSERT anymore)
    // const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // const userAgent = request.headers.get('user-agent') || '';
    const sessionId = request.cookies.get('session_id')?.value || 
                     `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // console.log(`[${requestId}] 🔍 Checking if article ${newsId} exists and is published...`);
    
    // Check if the news article exists and is published
    const newsItem = await db.execute<{ id: number; title: string }>(sql`
      SELECT id, title FROM news 
      WHERE id = ${newsId} AND status = 'published'
    `).then(res => res.rows[0]);

    if (!newsItem) {
      const error = 'News article not found or not published';
      // console.error(`[${requestId}] ❌ ${error}`);
      return createResponse(false, { error }, 404);
    }

    // Create a unique key for this view attempt
    const viewKey = `view:${newsId}:${sessionId}`;
    
    // console.log(`[${requestId}] 🔄 Checking for duplicate view with key: ${viewKey}`);
    
    // Check if this is a duplicate view using Redis
    const hasViewed = await redis.get(viewKey);
    if (hasViewed) {
      // console.log(`[${requestId}] ℹ️ View already recorded recently for session`);
      return createResponse(true, { 
        message: 'View already recorded',
        timestamp: new Date().toISOString()
      });
    }

    // console.log(`[${requestId}] 📝 Recording new view for article ${newsId} (${newsItem.title})`);
    
    // Record the view in Redis with a 1-hour TTL to prevent duplicates
    await redis.setex(viewKey, 3600, '1');
    // console.log(`[${requestId}] ✅ View recorded in Redis with key: ${viewKey}`);

    // Increment *TREND SCORES* in Redis with different weights
    // console.log(`[${requestId}] 📊 Updating trending scores in Redis...`);
    const pipeline = redis.pipeline();
    
    // Increment counters with different weights for trending
    pipeline.zincrby('trending:daily', 1, newsId.toString());
    pipeline.zincrby('trending:weekly', 0.14, newsId.toString());
    pipeline.zincrby('trending:monthly', 0.033, newsId.toString());
    
    // Set expiry for the sorted sets to manage data lifecycle
    pipeline.expire('trending:daily', 172800);  // 2 days
    pipeline.expire('trending:weekly', 691200); // 8 days
    pipeline.expire('trending:monthly', 2592000); // 30 days
    
    // Execute the Redis pipeline without storing the results since we don't use them
    await pipeline.exec();

    // Record the view in the database for long-term storage and increment the persistent view count
    try {
      // console.log(`[${requestId}] 💾 Saving view to database and updating persistent view count...`);
      
      // 1. Insert into news_views table for detailed tracking (without ip_address and user_agent)
      // We don't need the result, so we don't store it
      await db.execute(sql`
        INSERT INTO news_views (news_id, session_id)
        VALUES (${newsId}, ${sessionId})
      `);
      
      // Atomically increment the persistent view_count in the news table
      await db.execute(sql`
        UPDATE news 
        SET view_count = view_count + 1,
            updated_at = NOW()
        WHERE id = ${newsId}
      `);

    } catch (dbError) {
      // Log the error but don't fail the request since Redis tracking is the priority
    }

    return createResponse(true, {
      message: 'View recorded successfully',
      timestamp: new Date().toISOString(),
      newsId,
      sessionId
    });

  } catch (error) {
    //   stack: error instanceof Error ? error.stack : undefined,
    //   newsId,
    //   timestamp: new Date().toISOString()
    // });
    
    return createResponse(false, { 
      error: 'Failed to record view',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, 500);
  }
}