import { type CSSProperties } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  quality?: number;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  unoptimized?: boolean;
  fit?: 'cover' | 'contain' | 'fill';
  onClick?: () => void;
}

export default function Image({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  quality = 85,
  priority = false,
  loading = 'lazy',
  sizes,
  placeholder = 'empty',
  blurDataURL,
  unoptimized = false,
  ...props
}: ImageProps) {
  if (!src) return null;

  // If unoptimized is true or it's a data URL, use Next.js Image directly
  if (unoptimized || src.startsWith('data:')) {
    return (
      <div 
        className={`relative ${className}`} 
        style={{ width: '100%', height: '100%', ...style }}
      >
        <img
          src={src}
          alt={alt || ''}
          width={width}
          height={height}
          loading={loading}
          className="w-full h-full object-cover"
          {...props}
        />
      </div>
    );
  }

  // Otherwise use our optimized image component
  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: '100%', height: '100%', ...style }}
    >
      
    </div>
  );
}
