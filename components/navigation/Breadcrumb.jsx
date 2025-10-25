import Link from 'next/link';

export function Breadcrumb({ items }) {
    return (
        <nav className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Home
                </Link>
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span>/</span>
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-gray-900 dark:text-white font-medium">
                                {item.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </nav>
    );
}
