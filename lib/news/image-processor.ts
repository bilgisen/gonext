import sharp from 'sharp';
import { createSlug } from './slug-utils';
import { NewsFetchError } from './types';

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
 * Image'i Netlify CDN'e upload eder
 * @param buffer - Image buffer
 * @param filename - Target filename (slug based)
 * @param options - Upload options
 * @returns Upload result
 */
export async function uploadToNetlifyCDN(
  buffer: Buffer,
  filename: string,
  options: ImageOptions = {}
): Promise<ImageUploadResult> {
  try {
    // Process image first
    const processedBuffer = await processImage(buffer, options);
    const metadata = await getImageMetadata(processedBuffer);
    const hash = await generateImageHash(processedBuffer);

    // Generate final filename with hash for cache busting
    const extension = options.format === 'png' ? 'png' :
                     options.format === 'webp' ? 'webp' : 'jpg';
    const finalFilename = `${filename}-${hash.substring(0, 8)}.${extension}`;

    // TODO: Implement actual Netlify CDN upload
    // For now, return mock result
    // In production, this would use Netlify Blobs API or similar service

    return {
      success: true,
      url: `https://cdn.example.com/images/${finalFilename}`,
      path: `/images/${finalFilename}`,
      metadata,
    };

    /*
    // Real implementation would be something like:

    const blob = await put(`images/${finalFilename}`, processedBuffer, {
      access: 'public',
      handleUploadUrlShortening: true,
    });

    return {
      success: true,
      url: blob.url,
      path: blob.pathname,
      metadata,
    };
    */

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Complete image processing pipeline
 * @param imageUrl - Source image URL
 * @param title - News title for filename generation
 * @param options - Processing options
 * @returns Upload result with metadata
 */
export async function processNewsImage(
  imageUrl: string,
  title: string,
  options: ImageOptions = {}
): Promise<ImageUploadResult> {
  try {
    // Fetch image
    const buffer = await fetchImageBuffer(imageUrl);

    // Generate filename from title
    const filename = createSlug(title, { maxLength: 50 });

    // Upload to CDN
    const result = await uploadToNetlifyCDN(buffer, filename, options);

    if (!result.success) {
      throw new NewsFetchError(
        `Image upload failed: ${result.error}`,
        'UPLOAD_ERROR'
      );
    }

    return result;
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
