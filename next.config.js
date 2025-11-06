// @ts-check
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  
  // Enable server actions
  experimental: {
    serverActions: {},
    // serverComponentsExternalPackages yerine serverExternalPackages kullanın
    // serverComponentsExternalPackages: ['ioredis'], // Eski hali
  },
  
  // serverExternalPackages seçeneğini ana seviyeye taşıyın
  serverExternalPackages: ['ioredis', '@netlify/neon'], // Redis ve Netlify için birleştirildi
  
  // Fix for module resolution in app directory
  transpilePackages: [],
  
  // Webpack configuration for path aliases
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd()),
      '@/db': path.resolve(process.cwd(), 'db'),
    };
    
    // Important: return the modified config
    return config;
  },
  
  // Image optimization configuration
  images: {
    // Define responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Use remotePatterns instead of domains for better security
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '3a3e9ce3-d5df-4556-b315-3765909dc963.netlify.app',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
      {
        protocol: 'https',
        hostname: '3a3e9ce3-d5df-4556-b315-3765909dc963--news-images.netlify.app',
      },
      {
        protocol: 'https',
        hostname: 'news-images--3a3e9ce3-d5df-4556-b315-3765909dc963.blob.netlify.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Redis için gerekli domain
      {
        protocol: 'https',
        hostname: 'clear-gnat-33879.upstash.io', // Redis sunucu adresiniz
      },
    ],
    // Enable Netlify Image CDN in production
    loader: 'default',
    // Disable image optimization in development for better performance
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Enable source maps in production for debugging
  productionBrowserSourceMaps: false,
  
  // Turbopack configuration
  // Keep this empty for now as Turbopack doesn't support custom rules in Next.js 16
  turbopack: {},
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],

  // Güvenlik başlıklarını ekleyin
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;