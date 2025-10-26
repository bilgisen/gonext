'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';

export default function TestUploadPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      // Use the correct Netlify Blobs URL returned by the upload API
      setImageUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Image Upload Test</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose an image to upload
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
        </div>

        {isUploading && (
          <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md">
            Uploading image, please wait...
          </div>
        )}

        {uploadError && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {uploadError}
          </div>
        )}

        {imageUrl && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Uploaded Image:</h2>
            <div className="border rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt="Uploaded preview"
                width={800}
                height={600}
                className="w-full h-auto"
                quality={90}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500 break-all">
              Image URL: {imageUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}