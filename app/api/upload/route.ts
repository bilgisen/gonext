import { NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
import 'dotenv/config';

// Import the proper store configuration
import { getNewsImageStore } from '../../../lib/blob-utils';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a unique filename without directory prefix
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;

    // Convert file to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Netlify Blob Store using library with binary data
    const store = getNewsImageStore();

    // Convert Buffer to ArrayBuffer for Netlify Blobs compatibility
    const arrayBufferForUpload = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    await store.set(filename, arrayBufferForUpload, {
      metadata: {
        contentType: file.type,
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      },
    });

    console.log('✅ File uploaded successfully:', filename);

    // Generate the public URL for the blob using correct Netlify Blobs format
    const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
    const storeName = 'news-images';
    const publicUrl = `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${filename}`;

    console.log('🔗 Generated URL:', publicUrl);

    return NextResponse.json({
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
