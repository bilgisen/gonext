import { Metadata } from 'next';
import { Suspense } from 'react';
import { TagNewsList } from './TagNewsList';

interface TagPageProps {
    params: Promise<{ tag: string }>;
    searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { tag } = await params;
    const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');

    return {
        title: `${formattedTag} News | Articles tagged with ${formattedTag}`,
        description: `Find all news articles tagged with ${formattedTag}. Stay updated with the latest stories and insights related to ${formattedTag}.`,
        openGraph: {
            title: `${formattedTag} Tag`,
            description: `News tagged with ${formattedTag}`,
            type: 'website',
        },
    };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
    const { tag } = await params;
    const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            #{formattedTag}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                            News articles tagged with &quot;{formattedTag}&quot;
                        </p>
                        <div className="flex justify-center">
                            <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                Tag: {formattedTag}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* News List */}
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<TagNewsSkeleton />}>
                    <TagNewsList tag={tag} searchParams={searchParams} />
                </Suspense>
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
