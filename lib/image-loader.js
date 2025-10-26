// Custom image loader for Netlify Image CDN
export default function imageLoader({ src, width, quality }) {
  // Return early if src is not provided
  if (!src) return '';

  // Handle local images
  const isLocal = src.startsWith('/') || src.startsWith('./') || src.startsWith('../');
  
  const params = new URLSearchParams();
  
  // For local images, remove the leading slash if present
  const url = isLocal ? src.replace(/^\//, '') : src;
  
  // Add required parameters
  params.append('url', url);
  
  // Add width if provided
  if (width) {
    params.append('w', width.toString());
  }
  
  // Add quality if provided (1-100)
  if (quality) {
    params.append('q', Math.min(100, Math.max(1, quality)).toString());
  }
  
  // Return the Netlify Image CDN URL
  return `/.netlify/images?${params.toString()}`;
}
