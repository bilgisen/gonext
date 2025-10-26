/**
 * Normalizes image URLs to use our Netlify Edge Function for serving images
 * Handles both full URLs and relative paths
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';

  // If it's already using our new format, return as is
  if (url.includes('/api/blob-image?id=')) {
    return url;
  }

  // If it's an API route URL, convert to our Edge Function format
  if (url.startsWith('/api/blobs/')) {
    const filename = url.replace('/api/blobs/', '');
    return `/api/blob-image?id=${encodeURIComponent(filename)}`;
  }

  // If it's a direct Netlify blob URL, extract the key
  if (url.includes('.netlify.app/')) {
    // Try to extract the blob key from the URL
    const keyMatch = url.match(/\.netlify\/blobs\/[^/]+\/(.+)$/);
    if (keyMatch && keyMatch[1]) {
      return `/api/blob-image?id=${encodeURIComponent(keyMatch[1])}`;
    }
  }

  // If it's an external URL, we can use it directly
  if (url.startsWith('http') && !url.includes('.netlify.app/')) {
    return url;
  }

  // For any other case, try to extract a filename and use it as the blob key
  try {
    const urlObj = new URL(url, 'http://example.com');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart && lastPart.includes('.')) {
      return `/api/blob-image?id=${encodeURIComponent(lastPart)}`;
    }
  } catch {
    // If URL parsing fails, just return the original URL
  }

  // If it's an S3 URL, extract the key and convert to Netlify Blobs format
  const s3Match = url.match(/s3\.[^/]+\/3a3e9ce3-d5df-4556-b315-3765909dc963\/site%3Anews-images\/([^?]+)/);
  if (s3Match) {
    const imageKey = decodeURIComponent(s3Match[1]);
    const siteId = '3a3e9ce3-d5df-4556-b315-3765909dc963';
    return `https://${siteId}.netlify.app/.netlify/blobs/site/${imageKey}`;
  }

  // If it's an HTTP URL but not from our S3, return as is
  if (url.startsWith('http')) {
    return url;
  }

  // Default case - assume it's a filename, convert to Netlify Blobs URL
  if (url.includes('.')) {
    const siteId = '3a3e9ce3-d5df-4556-b315-3765909dc963';
    return `https://${siteId}.netlify.app/.netlify/blobs/site/${url}`;
  }

  return url.startsWith('/') ? url : `/${url}`;
}
