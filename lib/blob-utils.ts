import https from 'https';
import { getStore } from '@netlify/blobs';

// Load environment variables
import 'dotenv/config';

const NEWS_IMAGES_STORE = 'news-images';

/**
 * Uploads data directly to Netlify Blobs API
 */
async function uploadDirectToBlobs(key: string, data: Buffer, metadata: Record<string, any> = {}): Promise<any> {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  return new Promise((resolve, reject) => {
    // Send binary data directly, not JSON
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${siteID}/blobs/news-images/${key}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': metadata?.contentType || 'image/jpeg',
        'Content-Length': data.length
      }
    };

    console.log('Making direct binary request to:', options.path);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`API request failed: ${res.statusCode}. Body: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('Direct API request error:', e);
      reject(e);
    });

    // Send binary data directly
    req.write(data);
    req.end();
  });
}

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
export async function uploadNewsImageBuffer(key: string, buffer: Buffer, metadata?: Record<string, any>) {
  const store = getNewsImageStore();

  console.log('Uploading binary data via library...');

  try {
    // Upload binary data directly using the library
    // Convert Buffer to ArrayBuffer for Netlify Blobs compatibility
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    await store.set(key, arrayBuffer, {
      metadata: {
        uploadedAt: new Date().toISOString(),
        contentType: metadata?.contentType || 'image/jpeg',
        ...metadata
      }
    });

    console.log('✅ Library binary upload successful');

  } catch (directError) {
    console.error('❌ Library upload failed:', directError.message);
    throw new Error(`Blob upload failed: ${directError.message}`);
  }

  // Generate the public URL for the blob using correct Netlify Blobs format
  const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
  const storeName = 'news-images';
  const publicUrl = `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${key}`;

  // Return the blob key and URL
  return {
    key,
    url: publicUrl
  };
}

/**
 * Uploads an image from a URL to Netlify Blobs
 * @param url The source URL of the image
 * @param key Optional custom key for the blob
 * @returns Object containing the blob key and public URL
 */
export async function uploadNewsImage(url: string, key?: string) {
  const store = getNewsImageStore();
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
