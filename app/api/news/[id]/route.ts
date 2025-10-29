import { NextResponse } from 'next/server';
import { getNewsById } from '@/lib/api/externalApiClient';

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
