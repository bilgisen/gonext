#!/usr/bin/env tsx

/**
 * Test script for news image upload to Netlify Blobs
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

// Log environment variables (without sensitive data)
console.log('🔍 Environment:');
console.log('- NETLIFY_SITE_ID:', process.env.NETLIFY_SITE_ID ? '✅ Set' : '❌ Missing');
console.log('- NETLIFY_AUTH_TOKEN:', process.env.NETLIFY_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
import { processNewsImage } from '../lib/news/image-processor';
import { NewsFetchError } from '../lib/news/types';

async function testNewsImageUpload() {
  try {
    console.log('🚀 Starting news image upload test...');
    
    // Test with a sample news image URL
    const testImageUrl = 'https://image.dunya.com/rcman/Cw1280h720q95gc/storage/files/images/2025/10/25/mmm-6ohn_cover.jpg';
    const testTitle = 'Test News Title for Image Upload';
    
    console.log(`📤 Testing with image: ${testImageUrl}`);
    
    // Process and upload the image
    const result = await processNewsImage(testImageUrl, testTitle, {
      width: 800,
      quality: 85,
      format: 'jpeg'
    });
    
    if (result.success && result.url) {
      console.log('✅ Image uploaded successfully!');
      console.log('📎 URL:', result.url);
      console.log('📊 Metadata:', JSON.stringify(result.metadata, null, 2));
      
      // Test serving the image
      try {
        console.log('\n🔄 Testing image serving...');
        const response = await fetch(result.url);
        if (response.ok) {
          console.log('✅ Image served successfully!');
          console.log('📝 Content-Type:', response.headers.get('content-type'));
          console.log('📦 Content-Length:', response.headers.get('content-length'), 'bytes');
        } else {
          console.error(`❌ Failed to serve image: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ Error testing image serving:', error);
      }
    } else {
      console.error('❌ Image upload failed:', result.error || 'Unknown error');
    }
  } catch (error) {
    if (error instanceof NewsFetchError) {
      console.error('❌ NewsFetchError:', error.message);
      if (error.code) console.error('Code:', error.code);
      if (error.cause) console.error('Cause:', error.cause);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  } finally {
    console.log('\n🏁 Test completed');
  }
}

// Run the test
testNewsImageUpload();
