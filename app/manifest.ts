// app/manifest.ts
import type { MetadataRoute } from 'next';

// Extend the Manifest type to include additional properties
type ExtendedManifest = MetadataRoute.Manifest & {
  iarc_rating_id?: string;
  shortcuts?: Array<{
    name: string;
    short_name: string;
    description: string;
    url: string;
    icons: Array<{ src: string; sizes: string }>;
  }>;
  prefer_related_applications?: boolean;
  related_applications?: Array<{
    platform: string;
    url: string;
    id: string;
  }>;
  scope_extensions?: string[];
  file_handlers?: Array<{
    action: string;
    accept: Record<string, string[]>;
  }>;
  protocol_handlers?: Array<{
    protocol: string;
    url: string;
  }>;
  share_target?: {
    action: string;
    method: string;
    enctype: string;
    params: {
      title: string;
      text: string;
      url: string;
    };
  };
};

export default function manifest(): ExtendedManifest {
  return {
    name: 'News Kiosk TR - Latest News about Türkiye',
    short_name: 'News Kiosk',
    description: 'Stay updated with the latest breaking news, politics, economy, sports, and culture from Türkiye. Professional news coverage you can trust.',
    start_url: '/?source=pwa',
    display: 'standalone', // Consider 'fullscreen' for a more immersive experience
    background_color: '#f8f9fa', // Lighter background for better contrast
    theme_color: '#1a365d', // Darker blue for better contrast
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['news', 'magazines', 'lifestyle'],
    lang: 'tr-TR',
    dir: 'ltr',
    prefer_related_applications: false,
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'News Kiosk Desktop View',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'News Kiosk Mobile View',
      },
      {
        src: '/screenshots/tablet.png',
        sizes: '1024x768',
        type: 'image/png',
        form_factor: 'wide',
        label: 'News Kiosk Tablet View',
      },
    ],
    
    // App shortcuts for quick access
    shortcuts: [
      {
        name: 'Son Dakika',
        short_name: 'Son Dakika',
        description: 'En son haberleri görüntüle',
        url: '/category/son-dakika?source=pwa_shortcut',
        icons: [{ src: '/icons/bolt-96x96.png', sizes: '96x96' }]
      },
      {
        name: 'Gündem',
        short_name: 'Gündem',
        description: 'Güncel gündem haberleri',
        url: '/category/gundem?source=pwa_shortcut',
        icons: [{ src: '/icons/trending-96x96.png', sizes: '96x96' }]
      },
      {
        name: 'Spor',
        short_name: 'Spor',
        description: 'Son spor haberleri',
        url: '/category/spor?source=pwa_shortcut',
        icons: [{ src: '/icons/sports-96x96.png', sizes: '96x96' }]
      }
    ],
    
    // Related applications (if you have native apps)
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=com.newsapp',
        id: 'com.newsapp'
      },
      {
        platform: 'itunes',
        url: 'https://apps.apple.com/tr/app/news-kiosk/id123456789',
        id: '123456789'
      }
    ],
    
    // IARC rating ID (get this from your IARC certificate)
    iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8c4aeb582',
    
    // Additional metadata
    scope_extensions: [
      'https://yourdomain.com',
      'https://*.yourdomain.com'
    ],
    
    // Handle file handling (if your app can open specific file types)
    file_handlers: [
      {
        action: '/open-file',
        accept: {
          'application/json': ['.json'],
          'text/plain': ['.txt']
        }
      }
    ],
    
    // Protocol handlers (if your app handles specific protocols)
    protocol_handlers: [
      {
        protocol: 'web+news',
        url: '/news?url=%s'
      }
    ],
    
    // Share target (if your app can receive shared content)
    share_target: {
      action: '/share',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url'
      }
    }
  };
}