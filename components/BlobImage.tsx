'use client';

import { useState, useMemo, memo } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface BlobImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  imageKey: string;
  alt: string;
  fallback?: React.ReactNode;
}

// Memoize the component to prevent unnecessary re-renders
const BlobImage = memo(function BlobImage({ 
  imageKey, 
  alt,
  className = '',
  fallback = null,
  onError,
  ...props 
}: BlobImageProps) {
  const [error, setError] = useState(false);
  
  // Memoize the image URL to prevent recreation on every render
  const imageUrl = useMemo(() => {
    if (!imageKey) return '';
    return `/api/images/${encodeURIComponent(imageKey)}`;
  }, [imageKey]);
  
  // Handle image error
  const handleError = useMemo(() => (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Failed to load image: ${imageKey}`);
    setError(true);
    onError?.(e);
  }, [imageKey, onError]);
  
  if (error && fallback) {
    return <>{fallback}</>;
  }
  
  if (error || !imageKey) {
    return (
      <div className={cn(
        'bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
        className
      )}>
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    );
  }
  
  return (
    <div className={cn('relative', className)}>
      <Image
        src={imageUrl}
        alt={alt}
        className={cn('object-cover', className)}
        onError={handleError}
        // Add cache control headers
        unoptimized={process.env.NODE_ENV !== 'production'}
        {...props}
      />
    </div>
  );
});

export default BlobImage;
