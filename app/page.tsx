import FrontPageSections from '@/components/frontPageSections';
import dynamicImport from 'next/dynamic';
import BannerCTA from '@/components/expostep';

// Make the page dynamic to handle server-side data
export const dynamic = 'force-dynamic';

// Revalidate every 5 minutes
export const revalidate = 300;

// Dynamically import the TrendingArticlesServer component with SSR
const TrendingArticlesServer = dynamicImport(
  () => import('@/components/front-category/TrendingArticlesServer'),
  { ssr: true } // Keep SSR enabled for better initial load
);
// Server Component - No 'use client' needed
export default async function HomePage() {
  // Fetch headlines on the server

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content - 3/4 width */}
          <div className="lg:w-3/4">
            {/* Content will be added here */}
            
            {/* Other categories */}
            <section className="mb-12">
              <FrontPageSections
                categories={['turkiye', 'business', 'world', 'technology', 'sports']}
                layout={['a', 'b']}
              />
            </section>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="lg:w-1/4 space-y-8">
            {/* ExpoStep Banner */}
            <div className="bg-card/70 rounded-2xl shadow-md overflow-hidden">
              <BannerCTA />
            </div>
            
            {/* Sticky content below */}
            <div className="sticky top-6 space-y-8">
              <TrendingArticlesServer />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
