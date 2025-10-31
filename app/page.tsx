'use client';
import dynamic from 'next/dynamic';
import FrontCategoryLayoutOne from '@/components/front-category/front-cat-layout-one';
import { Separator } from '@/components/ui/separator';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

// Dinamik import (lazy load)
const FrontCardLayoutTwo = dynamic(
  () => import('@/components/front-category/front-card-layout-two'),
  { ssr: false, loading: () => <div className="h-40 bg-muted animate-pulse rounded" /> }
);

function HomePageContent() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <section className="mb-12">
        {/* Headlines */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">Headlines</h2>
          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              {['Istanbul', 'Ankara', 'İzmir'].map((city) => (
                <NavigationMenuItem key={city}>
                  <NavigationMenuLink className="text-sm font-medium hover:text-black">
                    {city}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <Separator className="mb-6"/>

        {/* İlk grid hemen yüklensin */}
        <FrontCategoryLayoutOne
          mainCategory="world"
          secondCategory="turkiye"
          thirdCategory="business"
          fourthCategory="sports"
          fifthCategory="technology"
          className="mb-8"
        />
      </section>

      {/* Diğer kategoriler lazy load olur */}
      <section className="space-y-12">
        {['turkiye','world','business','technology','sports','culture'].map((cat) => (
          <div key={cat} className="space-y-4">
            <h3 className="text-2xl font-semibold capitalize">{cat}</h3>
            <FrontCardLayoutTwo category={cat} limit={5} offset={1} />
          </div>
        ))}
      </section>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
