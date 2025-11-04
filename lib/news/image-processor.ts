// lib/news/image-processor.ts
import sharp from 'sharp';
import { createSlug } from './slug-utils';
import { NewsFetchError } from './types';
import { uploadNewsImageBuffer } from '../blob-utils';

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
    console.log(`📤 Starting upload for: ${imageUrl}`);
    
    // Validate that it's a remote image URL
    if (!imageUrl.startsWith('http')) {
      const errorMsg = 'Only remote image URLs are supported';
      console.error(`❌ ${errorMsg}: ${imageUrl}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (!validateImageUrl(imageUrl)) {
      const errorMsg = 'Invalid image URL format';
      console.error(`❌ ${errorMsg}: ${imageUrl}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Download and process image
    console.log('⬇️  Downloading image...');
    const buffer = await fetchImageBuffer(imageUrl);
    console.log('✅ Image downloaded, size:', buffer.length, 'bytes');
    
    console.log('🔄 Processing image...');
    const processedBuffer = await processImage(buffer, options);
    const metadata = await getImageMetadata(processedBuffer);
    const hash = await generateImageHash(processedBuffer);
    console.log('✅ Image processed, dimensions:', `${metadata.width}x${metadata.height}`);

    // Generate final filename with hash for cache busting
    const extension = options.format === 'png' ? 'png' :
                     options.format === 'webp' ? 'webp' : 'jpg';
    const finalFilename = `${filename}-${hash.substring(0, 8)}.${extension}`;
    console.log(`📁 Generated filename: ${finalFilename}`);

    // Try to upload to Netlify Blobs
    try {
      console.log('☁️  Uploading to Netlify Blobs...');
      // Set content type based on file extension
      const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

      // Generate the final filename with hash for cache busting
      console.log(`📁 Generated filename: ${finalFilename}`);

      // Upload the processed buffer directly
      const result = await uploadNewsImageBuffer(finalFilename, processedBuffer, {
        originalUrl: imageUrl,
        processedAt: new Date().toISOString(),
        format: extension,
        contentType,
        ...(metadata ? Object.fromEntries(
          Object.entries(metadata).filter(([key]) => key !== 'format')
        ) : {}) // Ensure metadata is an object and remove any duplicate format property
      });

      // Upload was successful via direct API
      console.log(`✅ Image uploaded to Netlify Blobs: ${finalFilename}`);
      console.log('🔗 Generated URL:', result.url);

      return {
        success: true,
        url: result.url,
        path: result.key,
        metadata,
      };

    } catch (blobError) {
      const errorMsg = blobError instanceof Error ? blobError.message : 'Unknown error during upload';
      console.error('❌ Netlify Blobs upload failed:', errorMsg);

      if (blobError instanceof Error && blobError.stack) {
        console.error('Stack:', blobError.stack);
      }

      return {
        success: false,
        error: errorMsg,
        metadata,
      };
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown upload error';
    console.error('❌ Upload failed:', errorMsg);
    
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    
    return {
      success: false,
      error: errorMsg,
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
    console.log(`🔄 Starting image processing for: ${imageUrl}`);
    
    // Validate URL first
    if (!validateImageUrl(imageUrl)) {
      console.error(`❌ Invalid image URL format: ${imageUrl}`);
      return {
        success: false,
        error: 'Invalid image URL format',
      };
    }

    // Generate a slug from the title for the filename
    const filename = createSlug(title) || 'image';
    console.log(`📁 Generated filename: ${filename}`);
    
    // Upload to Netlify CDN
    const result = await uploadToNetlifyCDN(imageUrl, filename, {
      width: options.width || 1200,
      height: options.height,
      quality: options.quality || 85,
      format: options.format || 'jpeg',
    });

    if (result.success) {
      console.log(`✅ Image uploaded successfully: ${result.url}`);
    } else {
      console.error(`❌ Failed to upload image: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in processNewsImage:', errorMessage);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate image URL
 * @param url - Image URL to validate
 * @returns Whether the URL is valid for image processing
 */
export function validateImageUrl(url: string): boolean {
  try {
    // Basic URL validation
    new URL(url);
    
    // Check common image URL patterns
    const imagePatterns = [
      /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,  // Ends with image extension
      /\/image\//i,                           // Contains /image/ in path
      /picsum\.photos/,                       // Allow picsum.photos
      /^https?:\/\//i                         // Must be HTTP/HTTPS URL
    ];
    
    return imagePatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}
