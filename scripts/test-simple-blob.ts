#!/usr/bin/env tsx

/**
 * Simple test for blob upload and retrieval
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local if it exists
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import { uploadNewsImageBuffer, getNewsImageUrl } from '../lib/blob-utils';

async function testBlobUpload() {
  try {
    console.log('🚀 Starting simple blob upload test...');

    // Create a simple test image buffer
    const testBuffer = Buffer.from('Test image data for blob upload');
    const key = `test-simple-${Date.now()}.txt`;

    console.log('📤 Uploading test blob...');

    // Upload the blob
    const result = await uploadNewsImageBuffer(key, testBuffer, {
      contentType: 'text/plain',
      test: true
    });

    console.log('✅ Upload result:', result);

    // Try to get the URL
    const url = await getNewsImageUrl(key);
    console.log('🔗 Generated URL:', url);

    if (url) {
      console.log('✅ URL generated successfully');
    } else {
      console.log('❌ Failed to generate URL');
    }

    console.log('🏁 Simple test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBlobUpload();
