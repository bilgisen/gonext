import FrontCategoryLayoutOne from '@/components/front-category/headlines';
import { getFrontPageHeadlines } from '@/lib/headline-fetching';
import FrontPageSections from '@/components/frontPageSections';
import TrendingArticlesWrapper from '@/components/front-category/TrendingArticlesWrapper';

// Server Component - No 'use client' needed
export default async function HomePage() {
  // Fetch headlines on the server
  const headlineData = await getFrontPageHeadlines();
  
  // Extract required data
  const initialData = {
    mainItem: headlineData.turkiye,
    leftItems: headlineData.business,
    rightItems: headlineData.world,
  };

  return (
    <main className="min-h-screen">
      {/* Full width section at the top */}
      <section className="w-full bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <FrontCategoryLayoutOne 
            initialData={initialData}
            className="w-full"
          />
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            <section className="mb-12">
              {/* Lazy load other categories */}
              <FrontPageSections
                categories={['turkiye', 'business', 'world', 'technology', 'sports', 'culture']}
                layout={['a', 'c']}
                offset={[1, 2, 2, 0, 0, 0]}
              />
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-8">
            <div className="bg-card/50 rounded-lg shadow p-0">
              <TrendingArticlesWrapper />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
