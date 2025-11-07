import FrontPageSections from '@/components/frontPageSections';
import TrendingArticlesWrapper from '@/components/front-category/TrendingArticlesWrapper';

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
                categories={['turkiye', 'business', 'world', 'technology', 'sports', 'culture']}
                layout={['a', 'b']}
                offset={[0, 0, 0, 0, 0, 0]}
              />
            </section>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="lg:w-1/4 space-y-8">
            <div className="sticky top-6">
              <TrendingArticlesWrapper />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
