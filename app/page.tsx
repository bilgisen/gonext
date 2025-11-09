import FrontPageSections from '@/components/frontPageSections';
import dynamic from 'next/dynamic';

// Dynamically import the TrendingArticlesServer component with no SSR
const TrendingArticlesServer = dynamic(
  () => import('@/components/front-category/TrendingArticlesServer'),
  { ssr: true } // Keep SSR enabled for better initial load
);
export const revalidate = 300;
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
            {/* Bookshall Logo - Not sticky */}
            <div>
              <a href="https://bookshall.com" target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src="/images/bookshall.png" 
                  alt="Bookshall" 
                  className="h-full w-full"
                />
              </a>
            </div>
            
            {/* Sticky content below the logo */}
            <div className="sticky top-6 space-y-8">
              <TrendingArticlesServer />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
