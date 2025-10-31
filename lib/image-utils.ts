/**
 * Type for optimized image data
 */
export interface OptimizedImage {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  sizes?: string;
}

/**
 * Generates a blur placeholder for images
 */
export function generateBlurPlaceholder(width: number, height: number): string {
  // This creates a tiny 1x1 transparent pixel as a placeholder
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create a simple gradient as a placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
  return dataUrl;
}

/**
 * Validates image dimensions
 */
export function validateDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  const MAX_DIMENSION = 4000;
  
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = MAX_DIMENSION;
      height = Math.round(MAX_DIMENSION / aspectRatio);
    } else {
      height = MAX_DIMENSION;
      width = Math.round(MAX_DIMENSION * aspectRatio);
    }
  }
  
  return { width, height };
}

/**
 * Creates an optimized image object
 */
export function createOptimizedImage(
  src: string,
  width: number,
  height: number,
  options: Partial<Omit<OptimizedImage, 'src' | 'width' | 'height'>> = {}
): OptimizedImage {
  const validated = validateDimensions(width, height);
  
  return {
    src,
    width: validated.width,
    height: validated.height,
    quality: 85,
    loading: 'lazy',
    placeholder: 'empty',
    unoptimized: false,
    ...options,
  };
}
