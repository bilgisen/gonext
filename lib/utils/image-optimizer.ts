import { getStore } from '@netlify/blobs';

type ImageFormat = 'webp' | 'avif' | 'jpg' | 'png' | 'jpeg' | 'gif';
type FitMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

// Define the store type based on the return type of getStore
type BlobStore = Awaited<ReturnType<typeof getStore>>;

// Initialize store only when needed
let store: BlobStore | null = null;

function getBlobStore(): BlobStore {
  if (!store) {
    const siteID = process.env.NEXT_PUBLIC_NETLIFY_SITE_ID;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!siteID || !token) {
      throw new Error('Netlify Blob store is not properly configured. Make sure NEXT_PUBLIC_NETLIFY_SITE_ID and BLOB_READ_WRITE_TOKEN are set in your environment variables.');
    }
    
    store = getStore({
      name: 'images',
      siteID,
      token,
    });
  }
  return store;
}

const SUPPORTED_FORMATS = ['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif'] as const;
const DEFAULT_QUALITY = 85;

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: FitMode;
  blur?: number;
  grayscale?: boolean;
}

/**
 * Checks if the URL is from an allowed domain
 */
function isAllowedDomain(url: string): boolean {
  if (!url) return false;
  
  const allowedDomains = [
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, ''),
    'images.unsplash.com',
    // Add other allowed domains here
  ].filter(Boolean) as string[];

  try {
    const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`);
    return allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch (e) {
    return false;
  }
}

/**
 * Generates an optimized image URL using Netlify Blob
 */
export async function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  if (!originalUrl) return '';
  
  // Return original URL if it's not from an allowed domain
  if (!isAllowedDomain(originalUrl)) {
    return originalUrl;
  }

  // Skip optimization for SVG and GIF if not explicitly requested
  const isSvg = originalUrl.toLowerCase().endsWith('.svg');
  const isGif = originalUrl.toLowerCase().endsWith('.gif');
  
  if ((isSvg || isGif) && !options.format) {
    return originalUrl;
  }

  // Default to WebP for better compression if no format is specified
  const format = options.format || 'webp';
  const quality = Math.min(100, Math.max(1, options.quality || DEFAULT_QUALITY));
  
  // Generate a cache key based on the URL and options
  const cacheKey = generateCacheKey(originalUrl, { ...options, format, quality });
  
  try {
    // Check if we have a cached version
    try {
      const store = getBlobStore();
      const cachedUrl = await store.get(cacheKey, { type: 'text' });
      if (cachedUrl) {
        return String(cachedUrl);
      }
    } catch (error) {
      console.warn('Failed to access Netlify Blob store:', error);
      // Continue with generating the optimized URL even if cache access fails
    }
    
    // If not in cache, generate the optimized URL
    const optimizedUrl = generateNetlifyImageUrl(originalUrl, {
      ...options,
      format,
      quality,
    });
    
    // Store the optimized URL in cache
    if (optimizedUrl) {
      try {
        const store = getBlobStore();
        await store.set(cacheKey, String(optimizedUrl), {
          metadata: {
            originalUrl,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to cache optimized image URL:', error);
        // Don't fail the function if caching fails
      }
    }
    
    return optimizedUrl;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return originalUrl; // Fallback to original URL on error
  }
}

/**
 * Generates a cache key for the image URL and options
 */
function generateCacheKey(url: string, options: ImageOptimizationOptions): string {
  const { width, height, quality, format, fit } = options;
  const params = new URLSearchParams({
    ...(width && { w: width.toString() }),
    ...(height && { h: height.toString() }),
    ...(quality && { q: quality.toString() }),
    ...(format && { fm: format }),
    ...(fit && { fit }),
  }).toString();
  
  return `${url}?${params}`;
}

/**
 * Generates a Netlify Image CDN URL with the specified transformations
 */
function generateNetlifyImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions
): string {
  const { width, height, quality, format, fit, blur, grayscale } = options;
  const params = new URLSearchParams();
  
  // Add width and height if specified
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  
  // Add quality (1-100)
  if (quality) params.set('q', quality.toString());
  
  // Add format if specified and supported
  if (format && SUPPORTED_FORMATS.includes(format)) {
    params.set('fm', format);
  }
  
  // Add fit mode if specified
  if (fit) params.set('fit', fit);
  
  // Add blur effect if specified (0-1000)
  if (blur !== undefined) {
    params.set('blur', Math.min(1000, Math.max(0, blur)).toString());
  }
  
  // Add grayscale effect if specified
  if (grayscale) {
    params.set('grayscale', '');
  }
  
  // Construct the final URL
  const baseUrl = originalUrl.startsWith('http')
    ? originalUrl
    : `${process.env.NEXT_PUBLIC_SITE_URL}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
  
  return `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
}

/**
 * Generates a srcset string for responsive images
 */
export function generateSrcSet(
  originalUrl: string,
  widths: number[],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string {
  return widths
    .map(width => {
      const url = generateNetlifyImageUrl(originalUrl, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Gets the dominant color of an image for placeholder
 * @param _imageUrl - URL of the image
 */
export async function getImageDominantColor(_imageUrl: string): Promise<string | null> {
  // Implementation would go here
  return null;
}

/**
 * Generates a low-quality image placeholder (LQIP)
 * @param _imageUrl - URL of the image
 */
export async function generateLqip(_imageUrl: string): Promise<string> {
  try {
    // This is a placeholder implementation
    // In a real app, you'd want to generate a very low quality version
    // of the image and return it as a base64 string
    return '';
  } catch (error) {
    console.error('Error generating LQIP:', error);
    return '';
  }
}
