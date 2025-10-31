// Map of URL slugs to display names
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'turkiye': 'Türkiye',
  // Add other category mappings here if needed
};

// Function to get display name from URL slug
export const getDisplayName = (slug: string): string => {
  const normalizedSlug = slug.toLowerCase();
  return (
    CATEGORY_DISPLAY_NAMES[normalizedSlug] ||
    normalizedSlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};
