// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { Logo } from '../components/navbar-02/logo';
import { NavMenu } from '../components/navbar-02/nav-menu';
import { NavigationSheet } from '../components/navbar-02/navigation-sheet';
import ThemeToggle from '@/components/theme-toggle';
import { PWAProvider } from '@/components/pwa/pwa-provider';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { NotificationPermissionDialog } from '@/components/pwa/notification-permission-dialog';
import { Toaster } from '@/components/ui/toaster';
import '../styles/globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import Footer from '@/components/footer';
import Link from "next/link";

// Viewport configuration for the application
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#1a365d' },
  ],
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app'),
  applicationName: 'NewsTR',
  title: {
    default: 'NewsTR - Latest News & Breaking Stories',
    template: '%s | NewsTR',
  },
  description: 'Get the latest news, breaking stories, and in-depth analysis across all categories. Stay informed with NewsTR - your trusted source for news.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NewsTR',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-startup-image',
        url: '/splash/iphone5_splash.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      // Add other splash screens as needed
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  referrer: 'origin-when-cross-origin',
  keywords: ['news', 'breaking news', 'latest news', 'world news', 'politics', 'technology', 'sports', 'entertainment'],
  authors: [{ name: 'NewsTR Team' }],
  creator: 'NewsTR',
  publisher: 'NewsTR',
  // OpenGraph with minimal defaults that won't override child routes
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'NewsTR',
    title: 'NewsTR - Latest News & Breaking Stories',
    description: 'Get the latest news, breaking stories, and in-depth analysis across all categories.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'NewsTR - Latest News & Breaking Stories',
      },
    ],
  },
  // Twitter with minimal defaults
  twitter: {
    card: 'summary_large_image',
    creator: '@newstr',
    site: '@newstr',
    title: 'NewsTR - Latest News & Breaking Stories',
    description: 'Get the latest news, breaking stories, and in-depth analysis across all categories.',
  },
  // Default robots settings (can be overridden by child routes)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NewsTR" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="NewsTR" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PWAProvider>
            <Providers>
              <nav className="bg-background/80 backdrop-blur-sm border-b fixed top-0 left-0 right-0 z-50">
                <div className="h-16 flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-4 md:gap-12">
                    <Logo />
                    <NavMenu className="hidden md:block" />
                  </div>
                  <div className="flex items-center gap-1 md:gap-1">
                    
                   
                    <ThemeToggle />
                    <Link href="/dashboard" className="p-0 text-foreground hover:text-foreground/80 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-user">
  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
  <circle cx="12" cy="7" r="4" />
</svg>
                    </Link>
                    <div className="md:hidden">
                      <NavigationSheet />
                    </div>
                  </div>
                </div>
              </nav>
              <main className="pt-16">
                {children}
                <Footer />
                <Toaster />
              </main>
              
              {/* PWA Components - These will show automatically when appropriate */}
              <InstallPrompt />
              <NotificationPermissionDialog />
            </Providers>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
