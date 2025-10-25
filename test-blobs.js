import('dotenv/config');
import { getStore } from '@netlify/blobs';

async function testBlobs() {
  try {
    console.log('🔑 Testing Netlify Blobs access...');
    console.log('Site ID:', process.env.NETLIFY_SITE_ID?.substring(0,8) + '...');
    console.log('Token:', process.env.NETLIFY_AUTH_TOKEN?.substring(0,15) + '...');

    if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
      console.log('❌ Environment variables not loaded');
      return;
    }

    const store = getStore('test-blobs');
    await store.set('test-key', 'test-value');

    console.log('✅ SUCCESS: Netlify Blobs working!');
    console.log('🎉 Real image uploads will work now');

  } catch (error) {
    console.log('❌ Netlify Blobs failed:', error.message);
    console.log('🔄 Check token scopes and regenerate if needed');
  }
}

testBlobs();
