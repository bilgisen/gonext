'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { NewsApiItem } from '@/lib/news/types';
import { uploadNewsImage } from '@/lib/news/image-utils';

interface NewsFormProps {
  initialData?: Partial<NewsApiItem>;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function NewsForm({ initialData, onSubmit, isSubmitting = false }: NewsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<NewsApiItem>>(initialData || {});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      setIsUploading(true);
      setError(null);
      const imageUrl = await uploadNewsImage(file);
      setFormData(prev => ({
        ...prev,
        image: imageUrl,
        image_title: file.name
      }));
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSubmit = new FormData();
      
      // Append all form data to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formDataToSubmit.append(key, item));
        } else if (value) {
          formDataToSubmit.append(key, value);
        }
      });

      await onSubmit(formDataToSubmit);
      router.push('/news');
    } catch (err) {
      console.error('Form submission failed:', err);
      setError('Form gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700">
          Başlık *
        </label>
        <input
          type="text"
          id="seo_title"
          name="seo_title"
          value={formData.seo_title || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700">
          Kısa Açıklama
        </label>
        <textarea
          id="seo_description"
          name="seo_description"
          value={formData.seo_description || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Kapak Resmi
        </label>
        <div className="mt-1 flex items-center">
          <div className="flex-1">
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
        {(imagePreview || formData.image) && (
          <div className="mt-2">
            <div className="h-48 w-full relative rounded-md overflow-hidden">
              <img
                src={imagePreview || formData.image || ''}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
        {isUploading && (
          <p className="mt-2 text-sm text-gray-500">Resim yükleniyor...</p>
        )}
      </div>

      <div>
        <label htmlFor="content_md" className="block text-sm font-medium text-gray-700">
          İçerik (Markdown)
        </label>
        <textarea
          id="content_md"
          name="content_md"
          value={formData.content_md || ''}
          onChange={handleChange}
          rows={10}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
