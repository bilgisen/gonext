import { NewsApiItem } from './types';

// Define a type for existing news items from the database
type ExistingNewsItem = {
  id: number;
  image_url?: string | null;
  main_media_id?: number | null;
  updated_at?: Date | null;
  [key: string]: any; // For any additional properties
};
import { db } from '../../db/client';
import { news, media } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { processNewsImage } from './image-processor';

// List of image filenames that should be replaced with the default breaking news image
const DEFAULT_IMAGE_PATTERNS = [
  'son-dakika-kirmizi',
  'son-dakika-kirmizi-co9r-cover-blpy_cover',
  // Add other patterns here as needed
];

/**
 * Checks if an image URL should be replaced with the default breaking news image
 * @param imageUrl - The image URL to check
 * @returns boolean - True if the image should be replaced
 */
export function shouldUseDefaultImage(imageUrl: string): boolean {
  if (!imageUrl) return false;
  
  const url = new URL(imageUrl);
  const pathname = url.pathname.toLowerCase();
  
  return DEFAULT_IMAGE_PATTERNS.some(pattern => 
    pathname.includes(pattern.toLowerCase())
  );
}

/**
 * Gets the appropriate image URL, replacing with default if needed
 * @param imageUrl - The original image URL
 * @returns The processed image URL
 */
export function getProcessedImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/images/breaking-news.jpg';
  
  if (shouldUseDefaultImage(imageUrl)) {
    return '/images/breaking-news.jpg';
  }
  
  return imageUrl;
}

/**
 * Updates the news item's image if it has changed
 * @param existingNews - The existing news item from the database
 * @param apiItem - The new news item from the API
 * @returns The updated image URL or null if no update was needed
 */
export async function updateNewsImageIfChanged(
  existingNews: ExistingNewsItem,
  apiItem: NewsApiItem
): Promise<{ imageUrl: string | null; imageChanged: boolean }> {
  if (!apiItem.image) {
    return { imageUrl: null, imageChanged: false };
  }

  // Check if the image has changed
  const currentImageUrl = existingNews.image_url || '';
  const newImageUrl = getProcessedImageUrl(apiItem.image);
  
  // If the URL is the same, no need to update
  if (currentImageUrl === newImageUrl) {
    return { imageUrl: null, imageChanged: false };
  }

  try {
    // Process the new image (this will handle uploading to CDN if needed)
    const processedImage = await processNewsImage(
      newImageUrl,
      apiItem.title || 'News Image',
      {
        width: 1200,
        quality: 85,
        format: 'webp'
      }
    );

    if (processedImage.success && processedImage.url) {
      // Update the news item with the new image
      await db.update(news)
        .set({
          image_url: processedImage.url, // This should match your schema
          updated_at: new Date()
        } as any) // Using type assertion as a last resort
        .where(eq(news.id, existingNews.id));

      // Update the media record if it exists
      if (existingNews.main_media_id) {
        await db.update(media)
          .set({
            external_url: processedImage.url, // Using external_url instead of url
            updated_at: new Date()
          } as any) // Using type assertion as a last resort
          .where(eq(media.id, existingNews.main_media_id));
      }

      return { imageUrl: processedImage.url, imageChanged: true };
    }
  } catch (error) {
    console.error('Error updating news image:', error);
    // If there's an error, we'll just keep the old image
  }

  return { imageUrl: null, imageChanged: false };
}

/**
 * Handles image processing for a news item
 * @param apiItem - The news item from the API
 * @param existingNews - Optional existing news item for updates
 * @returns The processed image URL
 */
export async function handleNewsImage(
  apiItem: NewsApiItem,
  existingNews?: ExistingNewsItem
): Promise<string> {
  // If no image is provided, use the default
  if (!apiItem.image) {
    return '/images/breaking-news.jpg';
  }

  // Check if we should use the default image
  const imageUrl = getProcessedImageUrl(apiItem.image);
  
  // If we have an existing news item, check if the image has changed
  if (existingNews) {
    if (existingNews.image_url === imageUrl) {
      return existingNews.image_url || imageUrl;
    }
    
    // If the image has changed, update it
    const { imageUrl: updatedUrl } = await updateNewsImageIfChanged(existingNews, {
      ...apiItem,
      image: imageUrl
    });
    
    return updatedUrl || imageUrl;
  }
  
  // For new items, just return the processed URL
  return imageUrl;
}
