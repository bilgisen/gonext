// app/layout.tsx
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Logo } from '../components/navbar-02/logo';
import { NavMenu } from '../components/navbar-02/nav-menu';
import { NavigationSheet } from '../components/navbar-02/navigation-sheet';
import  ThemeToggle from '@/components/theme-toggle';
import '../styles/globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import Footer from '@/components/footer';
import { GeistSans } from 'geist/font/sans';

// Base metadata that provides sensible defaults but allows child routes to override
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://newstr.netlify.app'),
  title: {
    default: 'NewsTR - Latest News & Breaking Stories',
    template: '%s | NewsTR',
  },
  description: 'Get the latest news, breaking stories, and in-depth analysis across all categories. Stay informed with NewsTR - your trusted source for news.',
  applicationName: 'NewsTR',
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
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      {/* Add suppressHydrationWarning to body to prevent warnings from extensions */}
      <body 
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
           <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <nav className="bg-background/80 backdrop-blur-sm border-b fixed top-0 left-0 right-0 z-50">
              <div className="h-16 flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 md:gap-12">
                  <Logo />
                  <NavMenu className="hidden md:block" />
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <ThemeToggle />
                  <div className="md:hidden">
                    <NavigationSheet />
                  </div>
                </div>
              </div>
            </nav>
            <main className="pt-16">
              {children}
              <Footer />
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
