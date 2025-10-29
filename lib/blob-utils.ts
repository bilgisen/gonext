import { getStore } from '@netlify/blobs';

// Load environment variables
import 'dotenv/config';

const NEWS_IMAGES_STORE = 'news-images';

/**
 * Gets the news images store instance
 */
export function getNewsImageStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    throw new Error('Missing NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN in local environment. Please check your .env.local file.');
  }

  // Create store with explicit configuration
  return getStore({
    name: NEWS_IMAGES_STORE,
    siteID,
    token
  });
}

/**
 * Uploads a buffer directly to Netlify Blobs
 * @param key The blob key
 * @param buffer The image buffer
 * @param metadata Optional metadata
 * @returns Object containing the blob key and public URL
 */
export async function uploadNewsImageBuffer(key: string, buffer: Buffer, metadata: Record<string, any> = {}) {
  const store = getNewsImageStore();
  console.log('Uploading binary data via library...');

  try {
    // Convert Buffer to Uint8Array for Netlify Blobs
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    // @ts-ignore - Netlify Blobs type definitions might be outdated
    await store.set(key, uint8Array, { metadata });
    console.log('✅ Library binary upload successful');
    
    const publicUrl = await getNewsImageUrl(key);
    if (!publicUrl) {
      throw new Error('Failed to generate public URL for the uploaded image');
    }
    
    return { key, url: publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Library upload failed:', errorMessage);
    throw new Error(`Blob upload failed: ${errorMessage}`);
  }
}

/**
 * Uploads an image from a URL to Netlify Blobs
 * @param url The source URL of the image
 * @param key Optional custom key for the blob
 * @returns Object containing the blob key and public URL
 */
export async function uploadNewsImage(url: string, key?: string) {
  const imageKey = key || `img-${Buffer.from(url).toString('base64url')}`;

  const imageResponse = await fetch(url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

  // Upload the image buffer directly
  const result = await uploadNewsImageBuffer(imageKey, Buffer.from(imageBuffer), {
    originalUrl: url,
    contentType
  });

  return result;
}

/**
 * Gets the public URL for a news image by its key
 * @param key The blob key
 * @returns The public URL if the blob exists, null otherwise
 */
export async function getNewsImageUrl(key: string) {
  const store = getNewsImageStore();
  const data = await store.get(key);
  if (data) {
    const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
    const storeName = 'news-images';
    return `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${key}`;
  }
  return null;
}

/**
 * Deletes a news image by its key
 * @param key The blob key to delete
 */
export async function deleteNewsImage(key: string) {
  const store = getNewsImageStore();
  await store.delete(key);
}

/**
 * Lists all news images with their metadata
 */
export async function listNewsImages() {
  const store = getNewsImageStore();
  const { blobs } = await store.list();

  return Promise.all(
    blobs.map(async (blob) => {
      // Get metadata separately as it's not included in the list result
      const metadata = await store.getMetadata(blob.key);
      const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
      const storeName = 'news-images';
      return {
        key: blob.key,
        url: `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${blob.key}`,
        metadata: metadata || {},
        lastModified: new Date().toISOString() // Using current timestamp since lastModified isn't in metadata
      };
    })
  );
}
