// app/page.tsx
'use client';

import FrontCategoryLayoutOne from '@/components/front-category/front-cat-layout-one';
import FrontCategoryFeatNewsCard from '@/components/cards/front-cat-feat-newscard';
import FrontCategoryThirdNewsCard from '@/components/front-category/front-cat-third-newscard';
import FrontCardLayoutTwo from '@/components/front-category/front-card-layout-two';
import { Separator } from '@/components/ui/separator';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
function HomePageContent() {
 
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <div className="w-1/4">
            <h2 className="text-2xl font-semibold">Headlines</h2>
          </div>
          <div className="w-3/4 flex justify-end">
            <NavigationMenu>
              <NavigationMenuList className="gap-4">
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium transition-colors hover:text-black">
                    Istanbul
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium transition-colors hover:text-black">
                    Ankara
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium transition-colors hover:text-black">
                    İzmir
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <Separator className="mb-6"/>

       <FrontCategoryLayoutOne 
  mainCategory="world" 
  secondCategory="turkiye" 
  thirdCategory="business"
  fourthCategory="sports"
  fifthCategory="technology"
  MainCard={FrontCategoryThirdNewsCard}
  SecondCard={FrontCategoryFeatNewsCard}
  ThirdCard={FrontCategoryThirdNewsCard}
  FourthCard={FrontCategoryThirdNewsCard}
  FifthCard={FrontCategoryThirdNewsCard}
  className="mb-8"
/>
      </section>
      
      {/* Category Sections */}
      <section className="space-y-12">
        

 <div className="flex items-center justify-between mb-2">
          <div className="w-1/4">
            <h2 className="text-2xl font-semibold">News from Türkiye</h2>
          </div>
          <div className="w-3/4 flex justify-end">
            <NavigationMenu>
              <NavigationMenuList className="gap-4">
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium transition-colors hover:text-black">
                    Istanbul
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium transition-colors hover:text-black">
                    Ankara
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium transition-colors hover:text-black">
                    İzmir
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <Separator className="mb-6"/>
        {/* Turkiye */}
        <div className="space-y-4">
<FrontCardLayoutTwo 
  category="turkiye" 
  limit={5}
  offset={1} // First 5 items
  className="mb-8"
/>
        </div>

        {/* World */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">World</h3>
          <FrontCardLayoutTwo 
  category="world" 
  limit={5}
  offset={1} // First 5 items
  className="mb-8"
/>
        </div>

              {/*Sport */}
         <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Business & Economy</h3>
          
<FrontCardLayoutTwo 
  category="business" 
  limit={5}
  offset={1} // First 5 items
  className="mb-8"
/>          
        </div>

 {/* Culture */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Technology</h3>
          <FrontCardLayoutTwo 
  category="technology" 
  limit={5}
  offset={1} // First 5 items
  className="mb-8"
/>    
        </div>

         {/* Sports */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Sports</h3>
         <FrontCardLayoutTwo 
  category="sports" 
  limit={5}
  offset={1} // First 5 items
  className="mb-8"
/>    
        </div>

        {/* World */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Arts & Culture</h3>
<FrontCardLayoutTwo 
  category="culture" 
  limit={5}
  offset={0} // First 5 items
  className="mb-8"
/>     

        </div>


      </section>
    </div>
  );
}

const HomePage = () => {
  return <HomePageContent />;
};

export default HomePage;
