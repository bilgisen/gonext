'use client';

import { useState } from 'react';
import FrontPageSections from '@/components/frontPageSections';

export default function WidgetSection() {
  // Initialize as true since this is a client component
  const [isMounted, setIsMounted] = useState(true);

  if (!isMounted) {
    return null; // This is a fallback, should not happen with isMounted always true
  }

  return (
    <section className="mt-12">
      <FrontPageSections
        categories={['turkiye', 'business', 'world', 'technology', 'sports', 'culture']}
        layout={['a', 'c']}
        offset={[0, 0]}
      />
    </section>
  );
}
