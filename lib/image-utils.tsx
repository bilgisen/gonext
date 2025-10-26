import React, { type CSSProperties } from 'react';
import type { ImageProps as NextImageProps } from 'next/image';
import Image from 'next/image';

type ImageOptions = {
  width: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill';
  format?: 'webp' | 'avif' | 'jpg' | 'png';
};

export function getOptimizedImageUrl(
  imageUrl: string,
  options: ImageOptions
): string {
  if (!imageUrl) return '';

  // If it's already our proxy URL, return as is
  if (imageUrl.includes('/api/serve-blob-image')) {
    return imageUrl;
  }

  // Handle Netlify Blob URLs
  if (imageUrl.includes('blob.netlify.app')) {
    try {
      const url = new URL(imageUrl);
      const key = url.pathname.split('/').pop();
      if (key) {
        return `/api/serve-blob-image?key=${encodeURIComponent(key)}`;
      }
    } catch (e) {
      console.error('Error parsing blob URL:', e);
    }
  }

  // Handle relative paths
  const isRelative = !imageUrl.startsWith('http');
  
  // For non-blob URLs, use Netlify's image transformation
  if (!isRelative) {
    const params = new URLSearchParams({
      url: imageUrl,
      w: options.width.toString(),
      ...(options.height && { h: options.height.toString() }),
      q: (options.quality || 85).toString(),
      fit: options.fit || 'cover',
      ...(options.format && { fm: options.format }),
    });
    return `/_netlify/images?${params.toString()}`;
  }

  // For local paths, just return as is
  return imageUrl;
}

type OptimizedImageProps = Omit<NextImageProps, 'src' | 'width' | 'height'> & {
  src: string;
  width: number;
  height: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill';
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  style?: CSSProperties;
};

export function OptimizedImage({
  src,
  width,
  height,
  quality = 85,
  fit = 'cover',
  format,
  className = '',
  alt = '',
  style,
  ...props
}: OptimizedImageProps & { alt?: string }): React.ReactElement | null {
  if (!src) return null;

  const optimizedUrl = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    fit,
    format,
  });

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Fallback to original image if optimized version fails
    const target = e.target as HTMLImageElement;
    if (target.src !== src) {
      target.src = src;
    }
  };

  return (
    <Image
      src={optimizedUrl}
      alt={alt}
      width={width}
      height={height}
      style={{ ...style, objectFit: fit }}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
