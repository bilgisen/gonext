// lib/headline-fetching.ts
import { NewsItem } from '@/types/news';
import { fetchNewsFromDatabase } from '@/hooks/queries/useExternalQueries';

/**
 * Fetches headline news for the main page.
 * Gets 1 item each from Turkey (main), Business (left), and World (right) categories.
 * @returns {Promise<Record<string, NewsItem | null>>} - An object containing a news item for each category.
 */
export interface HeadlineResults {
  turkiye: NewsItem | null;
  business: NewsItem[];
  world: NewsItem[];
}

export async function getFrontPageHeadlines(): Promise<HeadlineResults> {
  const results: HeadlineResults = {
    turkiye: null,
    business: [],
    world: []
  };

  try {
    // Fetch main headline (Turkey)
    const mainPromise = fetchNewsFromDatabase({ 
      category: 'turkiye',
      limit: 1,
      sort: 'newest'
    }).then(response => {
      if (response?.items?.[0]) {
        results.turkiye = response.items[0];
      }
    });

    // Fetch business news (left column) - get 2 items
    const businessPromise = fetchNewsFromDatabase({
      category: 'business',
      limit: 2,
      sort: 'newest'
    }).then(response => {
      if (response?.items?.length) {
        results.business = response.items;
      }
    });

    // Fetch world news (right column) - get 2 items
    const worldPromise = fetchNewsFromDatabase({
      category: 'world',
      limit: 2,
      sort: 'newest'
    }).then(response => {
      if (response?.items?.length) {
        results.world = response.items;
      }
    });

    // Wait for all requests to complete
    await Promise.all([mainPromise, businessPromise, worldPromise]);
    
    console.log('✅ Fetched headlines:', {
      turkiye: results.turkiye ? '✅' : '❌',
      business: results.business.length,
      world: results.world.length
    });
    
  } catch (error) {
    console.error('❌ Error in getFrontPageHeadlines:', error);
  }

  return results;
}