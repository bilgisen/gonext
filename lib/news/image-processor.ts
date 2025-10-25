import sharp from 'sharp';
import { createSlug } from './slug-utils';
import { NewsFetchError } from './types';
import { getStore } from '@netlify/blobs';

// Ensure dotenv is loaded
import 'dotenv/config';

/**
 * Image format options
 */
export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hash?: string;
}

/**
 * Netlify CDN upload result
 */
export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  metadata?: ImageMetadata;
  error?: string;
}

/**
 * Remote image'i fetch eder ve buffer'a çevirir
 * @param imageUrl - Image URL
 * @returns Image buffer
 */
export async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'GoNext-ImageFetcher/1.0',
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new NewsFetchError(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
        'IMAGE_FETCH_ERROR'
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new NewsFetchError(
        `Invalid content type: ${contentType}`,
        'INVALID_IMAGE_TYPE'
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof NewsFetchError) {
      throw error;
    }

    throw new NewsFetchError(
      'Failed to fetch image',
      'IMAGE_FETCH_ERROR',
      error as Error
    );
  }
}

/**
 * Image'i process eder (resize, format conversion, optimization)
 * @param buffer - Original image buffer
 * @param options - Processing options
 * @returns Processed image buffer
 */
export async function processImage(
  buffer: Buffer,
  options: ImageOptions = {}
): Promise<Buffer> {
  const {
    width = 800,
    height,
    quality = 85,
    format = 'jpeg'
  } = options;

  try {
    let sharpInstance = sharp(buffer);

    // Get original metadata
    const metadata = await sharpInstance.metadata();

    // Resize if needed
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert format if needed
    if (format === 'jpeg' && metadata.format !== 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png' && metadata.format !== 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    throw new NewsFetchError(
      'Failed to process image',
      'IMAGE_PROCESS_ERROR',
      error as Error
    );
  }
}

/**
 * Image hash oluşturur (duplication kontrolü için)
 * @param buffer - Image buffer
 * @returns SHA-256 hash
 */
export async function generateImageHash(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Image metadata çıkarır
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  } catch (error) {
    throw new NewsFetchError(
      'Failed to get image metadata',
      'METADATA_ERROR',
      error as Error
    );
  }
}

/**
 * Generate Netlify Image CDN URL for remote images
 * @param imageUrl - Original remote image URL
 * @param options - Image transformation options
 * @returns Netlify Image CDN URL
 */
export function generateNetlifyImageCDNUrl(
  imageUrl: string,
  options: ImageOptions = {}
): string {
  const { width = 800, height, quality = 85, format } = options;

  // Construct Netlify Image CDN URL with query parameters
  let cdnUrl = `/.netlify/images?url=${encodeURIComponent(imageUrl)}`;

  if (width) cdnUrl += `&w=${width}`;
  if (height) cdnUrl += `&h=${height}`;
  if (format) cdnUrl += `&fm=${format}`;
  if (quality && quality !== 85) cdnUrl += `&q=${quality}`;

  // Use fit=contain by default to maintain aspect ratio
  cdnUrl += '&fit=contain';

  return cdnUrl;
}

/**
 * Image'i Netlify Blobs'a upload eder
 * @param imageUrl - Remote image URL
 * @param filename - Target filename (slug based)
 * @param options - Processing options
 * @returns Upload result with Netlify CDN URL
 */
export async function uploadToNetlifyCDN(
  imageUrl: string,
  filename: string,
  options: ImageOptions = {}
): Promise<ImageUploadResult> {
  try {
    // Validate that it's a remote image URL
    if (!imageUrl.startsWith('http')) {
      throw new NewsFetchError(
        'Only remote image URLs are supported',
        'INVALID_REMOTE_URL'
      );
    }

    if (!validateImageUrl(imageUrl)) {
      throw new NewsFetchError(
        'Invalid image URL format',
        'INVALID_IMAGE_URL'
      );
    }

    // Download and process image
    const buffer = await fetchImageBuffer(imageUrl);
    const processedBuffer = await processImage(buffer, options);
    const metadata = await getImageMetadata(processedBuffer);
    const hash = await generateImageHash(processedBuffer);

    // Generate final filename with hash for cache busting
    const extension = options.format === 'png' ? 'png' :
                     options.format === 'webp' ? 'webp' : 'jpg';
    const finalFilename = `${filename}-${hash.substring(0, 8)}.${extension}`;

    // Try to upload to Netlify Blobs
    try {
      const store = getStore({
        name: 'news-images',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
      });

      // Create a Blob from the processed buffer
      const blob = new Blob([new Uint8Array(processedBuffer)], {
        type: `image/${extension === 'jpg' ? 'jpeg' : extension}`
      });

      await store.set(finalFilename, blob, {
        metadata: {
          originalUrl: imageUrl,
          processedAt: new Date().toISOString(),
          format: extension,
          ...metadata
        }
      });

      console.log(`✅ Image uploaded to Netlify Blobs: ${finalFilename}`);

      // Generate Netlify Image CDN URL for the uploaded image
      const blobUrl = `/.netlify/images?url=${encodeURIComponent(`https://your-site.netlify.app/.netlify/blobs/news-images/${finalFilename}`)}`;

      return {
        success: true,
        url: blobUrl,
        path: `/.netlify/blobs/news-images/${finalFilename}`,
        metadata,
      };

    } catch (blobError) {
      console.error('❌ Netlify Blobs upload failed:', blobError);

      // Fallback: Use Netlify Image CDN directly with original URL
      const cdnUrl = generateNetlifyImageCDNUrl(imageUrl, options);

      return {
        success: true,
        url: cdnUrl,
        path: cdnUrl,
        metadata,
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Complete image processing pipeline for remote images
 * @param imageUrl - Source remote image URL
 * @param title - News title for filename generation (used for fallback)
 * @param options - Processing options
 * @returns Upload result with Netlify CDN URL
 */
export async function processNewsImage(
  imageUrl: string,
  title: string,
  options: ImageOptions = {}
): Promise<ImageUploadResult> {
  try {
    // Validate image URL
    if (!validateImageUrl(imageUrl)) {
      throw new NewsFetchError(
        `Invalid image URL: ${imageUrl}`,
        'INVALID_IMAGE_URL'
      );
    }

    // For remote images, use Netlify Image CDN
    if (imageUrl.startsWith('http')) {
      const filename = createSlug(title, { maxLength: 50 });
      const result = await uploadToNetlifyCDN(imageUrl, filename, options);

      // Always return success since we have fallback system
      return result;
    }

    // For local images (if any), return error since we only support remote URLs
    throw new NewsFetchError(
      'Only remote image URLs are supported',
      'REMOTE_ONLY'
    );
  } catch (error) {
    if (error instanceof NewsFetchError) {
      throw error;
    }

    throw new NewsFetchError(
      'Image processing pipeline failed',
      'PIPELINE_ERROR',
      error as Error
    );
  }
}

/**
 * Validate image URL
 * @param url - Image URL to validate
 * @returns Valid image URL or null
 */
export function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const pathname = urlObj.pathname.toLowerCase();

    return validExtensions.some(ext => pathname.endsWith(ext)) ||
           url.includes('image') ||
           /\.(jpg|jpeg|png|gif|webp)$/i.test(pathname);
  } catch {
    return false;
  }
}
