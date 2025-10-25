import Link from 'next/link';
import { CATEGORY_MAPPINGS } from '../../types/news';

export function MainNavigation() {
    const categories = Object.entries(CATEGORY_MAPPINGS).reduce((acc, [key, category]) => {
        if (!acc.includes(category)) {
            acc.push(category);
        }
        return acc;
    }, []);

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                {/* Top Navigation */}
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">N</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            NewsTR
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/news"
                            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            All News
                        </Link>
                        <Link
                            href="/"
                            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Home
                        </Link>
                    </nav>

                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/search"
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </Link>
                        <button className="md:hidden p-2 text-gray-600 dark:text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Category Navigation */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-6 py-3 overflow-x-auto">
                        <Link
                            href="/news"
                            className="whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            All Categories
                        </Link>
                        {categories.slice(0, 8).map((category) => (
                            <Link
                                key={category}
                                href={`/category/${category.toLowerCase()}`}
                                className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {category}
                            </Link>
                        ))}
                        {categories.length > 8 && (
                            <span className="text-sm text-gray-500 dark:text-gray-500">
                                +{categories.length - 8} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
