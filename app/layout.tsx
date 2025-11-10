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

// Base metadata that provides sensible defaults but allows child routes to override
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
  referrer: 'origin-when-cross-origin',
  keywords: ['news', 'breaking news', 'latest news', 'world news', 'politics', 'technology', 'sports', 'entertainment'],
  authors: [{ name: 'NewsTR Team' }],
  creator: 'NewsTR',
  publisher: 'NewsTR',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#1a365d' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
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
                  <div className="flex items-center gap-2 md:gap-3">
                    <Link href="/news" className="p-2 text-foreground hover:text-foreground/80 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </Link>
                    <button className="text-foreground hover:text-foreground/80 transition-colors">
                      <svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor" className="text-foreground">
                        <path fillRule="evenodd" d="M17.5 9c0 1.14-.3 1.99-.79 2.54-.46.52-1.27.96-2.71.96s-2.25-.44-2.71-.96A3.74 3.74 0 0 1 10.5 9c0-1.14.3-1.99.79-2.54.46-.52 1.27-.96 2.71-.96s2.25.44 2.71.96c.5.55.79 1.4.79 2.54zM19 9c0 2.76-1.45 5-5 5s-5-2.24-5-5 1.45-5 5-5 5 2.24 5 5zm-8 8.5h6c2.04 0 3.1.5 3.76 1.1.69.63 1.11 1.55 1.5 2.8.13.42.04.95-.29 1.4-.33.46-.8.7-1.22.7H7.25c-.43 0-.89-.24-1.22-.7a1.61 1.61 0 0 1-.3-1.4 6.08 6.08 0 0 1 1.51-2.8c.65-.6 1.72-1.1 3.76-1.1zm6-1.5h-6c-4.6 0-5.88 2.33-6.7 4.96-.58 1.89.97 4.04 2.95 4.04h13.5c1.98 0 3.53-2.15 2.95-4.04C22.88 18.33 21.6 16 17 16z" fill="currentColor"/>
                      </svg>
                    </button>
                    <ThemeToggle />
                    <Link href="/dashboard" className="p-2 text-foreground hover:text-foreground/80 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
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
