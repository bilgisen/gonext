import { Metadata } from 'next';
import { Suspense } from 'react';
import { TagNewsList } from './TagNewsList';

// Import the TrendingArticlesWrapper component
import TrendingArticlesWrapper from '@/components/front-category/TrendingArticlesWrapper';

interface TagPageProps {
    params: Promise<{ tag: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { tag } = await params;
    const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');

    return {
        title: `${formattedTag} News | Latest news about ${formattedTag}`,
        description: `Find all news articles tagged with ${formattedTag}. Stay updated with the latest stories and insights related to ${formattedTag}.`,
        openGraph: {
            title: `${formattedTag} News`,
            description: `News tagged with ${formattedTag}`,
            type: 'website',
        },
    };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
    const { tag } = await params;
    const searchParamsObj = await searchParams as { [key: string]: string | string[] | undefined };
    const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="">
                <div className="container mx-auto px-4 pt-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold capitalize text-foreground mb-4">
                            {formattedTag}
                        </h1>
                        <p className="text-xl text-muted-foreground mb-6">
                            News articles about {formattedTag}
                        </p>
                    
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content - 3/4 width on large screens */}
                    <div className="w-full lg:w-3/4">
                        <Suspense fallback={<TagNewsSkeleton />}>
                            <TagNewsList tag={tag} searchParams={searchParamsObj} />
                        </Suspense>
                    </div>
                    
                    {/* Sidebar - 1/4 width on large screens, full width on mobile */}
                    <div className="w-full lg:w-1/4 space-y-6">
                        <div className="sticky top-4">
                            <TrendingArticlesWrapper limit={5} period="daily" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Loading skeleton
function TagNewsSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex gap-4">
                            <div className="shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                <div className="flex gap-2">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
