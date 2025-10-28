import type { Metadata } from 'next';
import { Providers } from './providers';
import { Logo } from '../components/navbar-02/logo';
import { NavMenu } from '../components/navbar-02/nav-menu';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import '../styles/globals.css';
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: 'NewsTR - Latest News & Breaking Stories',
    template: '%s | NewsTR'
  },
  description: 'Get the latest news, breaking stories, and in-depth analysis across all categories. Stay informed with NewsTR - your trusted source for news.',
  keywords: 'news, breaking news, latest news, world news, politics, technology, sports, business, health, entertainment',
  authors: [{ name: 'NewsTR Team' }],
  creator: 'NewsTR',
  publisher: 'NewsTR',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://newstr.netlify.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://newstr.netlify.app',
    title: 'NewsTR - Latest News & Breaking Stories',
    description: 'Get the latest news, breaking stories, and in-depth analysis across all categories.',
    siteName: 'NewsTR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NewsTR - Latest News & Breaking Stories',
    description: 'Get the latest news, breaking stories, and in-depth analysis across all categories.',
    creator: '@newstr',
  },
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen pt-16">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <Providers>
          <nav className="bg-background/70 backdrop-blur-sm border-b fixed top-0 left-0 right-0 z-50">
            <div className="h-16 flex items-center justify-between max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-12">
                <Logo />

                {/* Desktop Menu */}
                <NavMenu className="hidden md:block" />
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Sign In
                </Button>
                <Button>Sign Up</Button>
                <ThemeToggle />

                {/* Mobile Menu */}
                <div className="md:hidden">
                  {/* Mobile menu can be added here if needed */}
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
