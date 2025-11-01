import FrontCategoryLayoutOne from '@/components/front-category/front-cat-layout-one';
import { getFrontPageHeadlines } from '@/lib/headline-fetching';
import FrontPageSections from '@/components/frontPageSections';

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
      <div className="container mx-auto px-4 py-8 space-y-12">
        <section className="mb-12">


          {/* Main headline section with server-rendered data */}
          <FrontCategoryLayoutOne 
            initialData={initialData} 
            className="mb-12"
          />

          {/* Lazy load other categories */}
         <FrontPageSections
  categories={['turkiye', 'business', 'world', 'technology', 'sports', 'culture']}
  layout={['a', 'c' ]} // 'turkiye'->a, 'business'->b, 'world'->c, 'technology'->a, 'sports'->b, 'culture'->c
  offset={[1, 2, 2, 2, 1, 0]} // 'turkiye'->1, 'business'->2, 'world'->1, 'technology'->2, 'sports'->1, 'culture'->0
/>
        </section>
      </div>
    </main>
  );
}
