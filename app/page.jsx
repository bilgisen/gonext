import Link from 'next/link';
import { Suspense } from 'react';

export default function HomePage() {
    return (
                    <Suspense fallback={<LatestNewsSkeleton />}>
                    </Suspense>
               
    );
}

// Loading skeletons
function FeaturedNewsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function LatestNewsSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
