import type { Metadata } from 'next';
import { Providers } from './providers';
import { MainNavigation } from '../components/navigation/MainNavigation';
import '../styles/globals.css';

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
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Providers>
          <MainNavigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
