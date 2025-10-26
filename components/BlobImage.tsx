'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface BlobImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  imageKey: string;
  alt: string;
  fallback?: React.ReactNode;
}

export default function BlobImage({ 
  imageKey, 
  alt,
  className = '',
  fallback = null,
  onError,
  ...props 
}: BlobImageProps) {
  const [error, setError] = useState(false);
  const imageUrl = `/api/images/${encodeURIComponent(imageKey)}`;
  
  if (error && fallback) {
    return <>{fallback}</>;
  }
  
  if (error) {
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
        onError={(e) => {
          setError(true);
          onError?.(e);
        }}
        {...props}
      />
    </div>
  );
}
