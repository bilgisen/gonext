// @ts-check
import path from 'path';
import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // Enable server actions
  experimental: {
    serverActions: {},
  },
  
  serverExternalPackages: ['ioredis', '@netlify/neon'],
  transpilePackages: [],
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd()),
      '@/db': path.resolve(process.cwd(), 'db'),
    };
    
    // Ensure service worker is properly handled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Image optimization configuration
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
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

  // Security headers
  async headers() {
    return [
      // Global security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Service Worker specific headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
      // Manifest file headers
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Icon files caching
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;