import { getStore } from '@netlify/blobs';
import { NewsApiItem } from './types';

const NEWS_IMAGES_STORE = 'news-images';

/**
 * Processes news items to ensure they have valid image URLs
 * - If the image is already from our blob storage, uses it as is
 * - Otherwise, downloads and uploads the image to Netlify Blobs
 * 
 * @param items Array of news items to process
 * @returns Processed news items with updated image URLs
 */
export async function processNewsItems(items: NewsApiItem[]): Promise<NewsApiItem[]> {
  const store = getStore(NEWS_IMAGES_STORE);
  
  return Promise.all(items.map(async (item) => {
    if (!item.image?.startsWith('http')) {
      return item; // Skip if no image or not an HTTP URL
    }

    try {
      // Check if we already have this image in the database with a Netlify Blobs URL
      if (item.image.includes('.netlify.app/.netlify/blobs/')) {
        return item; // Already processed
      }

      // Check if we already have this image in the store
      const imageKey = `img-${Buffer.from(item.image).toString('base64url')}`;
      const existingBlob = await store.get(imageKey);
      
      if (existingBlob) {
        const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
        const storeName = 'news-images';
        return {
          ...item,
          image: `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${imageKey}`
        };
      }

      // Download the image
      const imageResponse = await fetch(item.image);
      if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Upload to Netlify Blobs
      await store.set(imageKey, imageBuffer, { 
        metadata: { 
          originalUrl: item.image,
          uploadedAt: new Date().toISOString(),
          contentType
        }
      });

      // Return the item with the correct Netlify Blobs URL
      const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
      const storeName = 'news-images';
      return {
        ...item,
        image: `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${imageKey}`
      };
    } catch (error) {
      console.error('Error processing image for news item:', error);
      return item; // Return original item on error
    }
  }));
}
