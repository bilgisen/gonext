'use client';

import Link from 'next/link';
import { CATEGORY_MAPPINGS } from '../../types/news';

const categoryColors = {
    Business: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Politics: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Technology: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Health: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Science: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    Entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    World: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    Travel: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    Education: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Environment: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    Lifestyle: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    General: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function CategoryGrid() {
    const categories = Object.entries(CATEGORY_MAPPINGS).reduce((acc, [key, category]) => {
        if (!acc.includes(category)) {
            acc.push(category);
        }
        return acc;
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
                <Link
                    key={category}
                    href={`/category/${category.toLowerCase()}`}
                    className="group"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${categoryColors[category] || categoryColors.General}`}>
                            {category}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {category} News
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Latest {category.toLowerCase()} articles
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
