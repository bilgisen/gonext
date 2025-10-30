// app/page.tsx
'use client';

import FrontCardLayoutTwo from '@/components/front-category/front-card-layout-two';
import FrontCategoryLayoutOne from '@/components/front-category/front-cat-layout-one';
import FrontCardLayoutFeat from '@/components/front-category/front-card-layout-feat';

function HomePageContent() {
  // Featured section configuration

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Featured Section with FrontFeat */}
      <section className="mb-12">
         <FrontCardLayoutFeat 
           category="all" 
           limit={5}
           className="featured-section"
         />
      </section>
      
      {/* Category Sections */}
      <section className="space-y-12">
        
        {/* Turkiye */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Türkiye</h3>
          <FrontCardLayoutTwo category="turkiye" limit={5} />
        </div>

        {/* World */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">World</h3>
          <FrontCategoryLayoutOne category="world" />
        </div>

              {/*Sport */}
         <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Sports</h3>
          
            <FrontCardLayoutTwo category="sports" limit={5} />
          
        </div>

 {/* Culture */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Arts & Culture</h3>
          <div className="">
            <FrontCategoryLayoutOne category="culture" limit={5} />
          </div>
        </div>

         {/* Travel */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Travel</h3>
          <div className="">
            <FrontCategoryLayoutOne category="travel" limit={5} />
          </div>
        </div>

      </section>
    </div>
  );
}

const HomePage = () => {
  return <HomePageContent />;
};

export default HomePage;
