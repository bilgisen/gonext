import Link from 'next/link';
import { Suspense } from 'react';
import { NewsHero } from '../components/news/NewsHero';
import { CategoryGrid } from '../components/news/CategoryGrid';
import { LatestNews } from '../components/news/LatestNews';
import { FeaturedNews } from '../components/news/FeaturedNews';

export default function HomePage() {
    return (
        <div className="pt-8">
            {/* Hero Section */}
            <NewsHero />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 space-y-12">
                {/* Featured News */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Featured News
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Top stories and breaking news
                        </p>
                    </div>
                    <Suspense fallback={<FeaturedNewsSkeleton />}>
                        <FeaturedNews />
                    </Suspense>
                </section>

                {/* Categories */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Categories
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Browse news by category
                        </p>
                    </div>
                    <CategoryGrid />
                </section>

                {/* Latest News */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Latest News
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Most recent news articles
                        </p>
                    </div>
                    <Suspense fallback={<LatestNewsSkeleton />}>
                        <LatestNews />
                    </Suspense>
                </section>
            </div>
        </div>
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
