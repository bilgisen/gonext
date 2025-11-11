// app/api/cron/send-notifications/route.ts
import { NextResponse } from 'next/server';
import { checkAndSendNewArticleNotifications } from '@/lib/news/notification-scheduler';

export const dynamic = 'force-dynamic'; // Ensure this runs dynamically

export async function GET(request: Request) {
  // Check for the secret token
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await checkAndSendNewArticleNotifications();
    return NextResponse.json({
      success: result.success !== false, // Use result.success if it exists, otherwise default to true
      count: result.count,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}