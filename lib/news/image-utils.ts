import { NewsApiItem } from './types';

export async function uploadNewsImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Resim yüklenirken bir hata oluştu');
  }

  const data = await response.json();
  return `/api/blobs/${data.filename}`; // Updated to use the correct path
}

export function getNewsImageUrl(item: NewsApiItem): string {
  // If the image is already a full URL, return it as is
  if (item.image.startsWith('http')) {
    return item.image;
  }
  
  // If it's a path, construct the full URL
  return item.image.startsWith('/') ? item.image : `/${item.image}`;
}
