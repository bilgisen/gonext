import { NextRequest, NextResponse } from 'next/server';
import { getNewsById } from '@/lib/api/externalApiClient';

// Internal API route for individual news data (runs on server, accesses database)
// This is NOT an external API - it's a Next.js internal route for server-client separation
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  let id = '';

  try {
    // Handle both Promise and non-Promise params for compatibility
    const resolvedParams = 'then' in params ? await params : params;
    id = resolvedParams.id;

    const result = await getNewsById(id);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Individual news API route error:', error);

    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: statusCode }
    );
  }
}
