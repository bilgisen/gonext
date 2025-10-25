import { Metadata } from 'next';
import { Suspense } from 'react';
import { SingleNews } from './SingleNews';

interface SingleNewsPageProps {
    params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: SingleNewsPageProps): Promise<Metadata> {
    const { category, slug } = await params;
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

    return {
        title: `${formattedCategory} News Article | Latest ${formattedCategory} Updates`,
        description: `Read the latest ${category} news article. Stay informed with breaking news, analysis, and insights in ${formattedCategory}.`,
        openGraph: {
            title: `${formattedCategory} News Article`,
            description: `Latest ${category} news and updates`,
            type: 'article',
        },
    };
}

export default async function SingleNewsPage({ params }: SingleNewsPageProps) {
    const { category, slug } = await params;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Suspense fallback={<SingleNewsSkeleton />}>
                <SingleNews category={category} slug={slug} />
            </Suspense>
        </div>
    );
}

// Loading skeleton
function SingleNewsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>

                    {/* Image */}
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
