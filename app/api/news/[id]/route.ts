import { NextResponse } from 'next/server';
import { databaseApiClient } from '@/lib/api/externalApiClient';

export const runtime = 'nodejs';

interface Context {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  _request: Request,
  context: Context
) {
  const params = await (context.params instanceof Promise ? context.params : Promise.resolve(context.params));
  try {
    const { id } = params;

    const result = await databaseApiClient.getNewsById(id);
    
    if (!result) {
      throw new Error('News item not found');
    }
    
    // Debug log to check the content of the result
    console.log('News item data:', {
      id: result.id,
      hasContentHtml: !!result.content_html,
      contentLength: result.content?.length,
      contentHtmlLength: result.content_html?.length,
      hasContentMd: !!result.content,
      contentSample: result.content?.substring(0, 50) + '...',
      contentHtmlSample: result.content_html?.substring(0, 50) + '...'
    });

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
