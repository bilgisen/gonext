import { NewsFetchError } from './error-handler';
import type { NewsApiItem, NewsApiResponse, NewsApiOptions } from './types';

/**
 * News API URL - Environment variable'dan alınır
 */
const NEWS_API_URL = process.env.NEWS_API_URL || 'https://goen.onrender.com/api/v1/news';

/**
 * API Key - Environment variable veya default
 */
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'karabey';

/**
 * HTTP timeout (milisaniye)
 */
const API_TIMEOUT = 30000; // 30 saniye

/**
 * Retry settings
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 saniye

/**
 * HTTP timeout wrapper
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
      const waitTime = Math.min(
        delay * Math.pow(2, attempt - 1) * jitter,
        30000 // Max 30 seconds
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempt++;
    }
  }

  throw lastError!;
}

/**
 * Fetch news from the external API with pagination and filtering
 */
export async function fetchNewsFromApi(
  options: NewsApiOptions = {}
): Promise<NewsApiResponse> {
  const {
    limit = 50,
    offset = 0,
    category,
    tag,
    search,
    status = 'published',
    sortBy = 'published_at',
    sortOrder = 'desc',
  } = options;

  const url = new URL(NEWS_API_URL);
  
  // Set query parameters
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('status', status);
  url.searchParams.set('sort_by', sortBy);
  url.searchParams.set('sort_order', sortOrder);
  
  if (category) {
    url.searchParams.set('category', Array.isArray(category) ? category.join(',') : category);
  }
  
  if (tag) {
    url.searchParams.set('tag', Array.isArray(tag) ? tag.join(',') : tag);
  }
  
  if (search) {
    url.searchParams.set('search', search);
  }

  try {
    const response = await withRetry(async () => {
      const fetchPromise = fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'GoNext-NewsFetcher/1.0',
        },
        signal: AbortSignal.timeout(API_TIMEOUT),
      });

      return withTimeout(fetchPromise, API_TIMEOUT);
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore JSON parse error
      }

      const error = new Error(`HTTP ${response.status}`);
      throw new NewsFetchError(
        errorData?.message || `API request failed: ${response.status} ${response.statusText}`,
        'API_ERROR',
        error
      );
    }

    const data: NewsApiResponse = await response.json();

    // Validate response format
    if (!data || typeof data !== 'object') {
      throw new NewsFetchError('Invalid API response format', 'INVALID_RESPONSE');
    }

    if (!Array.isArray(data.items)) {
      throw new NewsFetchError('Invalid API response: items array missing', 'INVALID_RESPONSE');
    }

    // Ensure we have a valid response structure
    const result: NewsApiResponse = {
      items: data.items || [],
      total: data.total ?? data.items?.length ?? 0,
      page: data.page ?? Math.floor(offset / limit) + 1,
      limit: data.limit ?? limit,
      has_more: (data.items?.length ?? 0) >= limit,
    };
    
    return result;
  } catch (error) {
    if (error instanceof NewsFetchError) {
      throw error;
    }

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new NewsFetchError('API request timeout', 'TIMEOUT_ERROR', error);
      }
      
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new NewsFetchError('Network error while fetching news', 'NETWORK_ERROR', error);
      }
      
      if (error.message.includes('JSON')) {
        throw new NewsFetchError('Invalid JSON response from server', 'INVALID_JSON', error);
      }
    }

    // Fallback for unknown errors
    throw new NewsFetchError(
      'An unknown error occurred while fetching news',
      'UNKNOWN_ERROR',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}


/**
 * Fetches a single news item by ID or slug
 * @param id - News ID or slug
 * @returns The news item or null if not found
 */
export async function fetchNewsById(id: string | number): Promise<NewsApiItem | null> {
  const url = new URL(NEWS_API_URL);
  url.pathname = `${url.pathname}/${id}`.replace('//', '/');

  try {
    const response = await withRetry(async () => {
      const fetchPromise = fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'GoNext-NewsFetcher/1.0',
          'Authorization': `Bearer ${NEWS_API_KEY}`,
        },
        signal: AbortSignal.timeout(API_TIMEOUT),
      });

      return withTimeout(fetchPromise, API_TIMEOUT);
    });

    if (response.status === 404) {
      return null; // Haber bulunamadı
    }

    if (!response.ok) {
      throw new NewsFetchError(
        `API request failed: ${response.status} ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = await response.json();

    // Single item response validation
    if (!data || typeof data !== 'object') {
      throw new NewsFetchError('Invalid single news response format', 'API_ERROR');
    }

    // API'nin single item response format'ına göre validation
    const requiredFields = ['id', 'source_guid', 'seo_title', 'content_md', 'original_url'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new NewsFetchError(`Missing required field: ${field}`, 'API_ERROR');
      }
    }

    return data as NewsApiItem;
  } catch (error) {
    if (error instanceof NewsFetchError) {
      throw error;
    }

    throw new NewsFetchError(
      'Unknown error while fetching news by ID',
      'UNKNOWN_ERROR',
      error as Error
    );
  }
}

/**
 * Checks if the API is healthy and accessible
 * @returns True if the API is healthy, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(NEWS_API_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 saniye timeout
    });

    return response.ok;
  } catch {
    return false;
  }
}
