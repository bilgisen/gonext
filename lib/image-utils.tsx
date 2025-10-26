import type { ImageProps as NextImageProps } from 'next/image';
import Image from 'next/image';
import { type CSSProperties } from 'react';

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
  
  // If it's already a Netlify CDN URL, return as is
  if (imageUrl.includes('/.netlify/images')) {
    return imageUrl;
  }

  // Handle relative paths
  const isRelative = !imageUrl.startsWith('http');
  const encodedUrl = isRelative ? imageUrl : encodeURIComponent(imageUrl);

  const params = new URLSearchParams({
    url: encodedUrl,
    w: options.width.toString(),
    ...(options.height && { h: options.height.toString() }),
    q: (options.quality || 85).toString(),
    fit: options.fit || 'cover',
    ...(options.format && { fm: options.format }),
  });

  return `/.netlify/images?${params.toString()}`;
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
  alt = '',
  width,
  height,
  quality = 85,
  fit = 'cover',
  format,
  style,
  className = '',
  ...props
}: OptimizedImageProps): JSX.Element | null {
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
