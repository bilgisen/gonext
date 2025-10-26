import { NewsApiItem } from './types';

/**
 * Downloads an image from a URL and uploads it to our blob storage
 * @param imageUrl The source image URL
 * @returns The new blob URL
 */
async function downloadAndUploadImage(imageUrl: string): Promise<string> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // Get the image data as a blob
    const blob = await response.blob();
    const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: blob.type });

    // Upload to our blob storage
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await uploadResponse.json();
    // Ensure we return the correct Netlify Blobs URL
    if (data.filename && typeof data.filename === 'string') {
      const siteId = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID || '3a3e9ce3-d5df-4556-b315-3765909dc963';
      const storeName = 'news-images';
      return `https://${siteId}.netlify.app/.netlify/blobs/${storeName}/${data.filename}`;
    }
    return imageUrl; // Fallback to original URL if filename is invalid
  } catch (error) {
    console.error('Error processing image:', error);
    // Return the original URL if something goes wrong
    return imageUrl;
  }
}

/**
 * Processes news items to download and replace external image URLs with our own
 * @param items Array of news items to process
 * @returns Processed news items with updated image URLs
 */
export async function syncNewsImages(items: NewsApiItem[]): Promise<NewsApiItem[]> {
  const processedItems: NewsApiItem[] = [];
  
  for (const item of items) {
    try {
      // Skip if no image or already processed
      if (!item.image || item.image.includes('.netlify.app/.netlify/blobs/news-images/')) {
        processedItems.push(item);
        continue;
      }

      // Process the image
      const newImageUrl = await downloadAndUploadImage(item.image);
      
      // Create a new item with the updated image URL
      processedItems.push({
        ...item,
        image: newImageUrl,
      });
    } catch (error) {
      console.error(`Error processing image for news ${item.id}:`, error);
      // Keep the original item if there's an error
      processedItems.push(item);
    }
  }

  return processedItems;
}

/**
 * Gets news items with processed images
 * This can be used as a drop-in replacement for the original API call
 */
export async function getNewsWithLocalImages(limit: number = 50, offset: number = 0): Promise<NewsApiItem[]> {
  try {
    // Fetch news from the original API
    const response = await fetch(`${process.env.NEWS_API_URL || 'https://goen.onrender.com/api/v1/news'}?limit=${limit}&offset=${offset}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process images in the background and return immediately
    if (data.items && Array.isArray(data.items)) {
      // Process images in the background
      syncNewsImages(data.items as NewsApiItem[])
        .then(processedItems => {
          // Update the items in place
          data.items = processedItems;
        })
        .catch(error => {
          console.error('Error processing images in background:', error);
        });
    }
    
    return data.items || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}
