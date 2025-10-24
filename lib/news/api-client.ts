import { NewsApiResponse, NewsApiItem, NewsFetchError } from './types';

/**
 * Test mode - local JSON file'dan mı okusun?
 */
const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_API_URL = process.env.TEST_API_URL || '/app/test/news.json';

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

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * News API'den haberleri çeker
 * @param limit - Maksimum haber sayısı
 * @param offset - Offset
 * @returns API response
 */
export async function fetchNewsFromApi(
  limit: number = 50,
  offset: number = 0
): Promise<NewsApiResponse> {
  const url = new URL(NEWS_API_URL);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());

  // API key'i query parameter olarak da ekle (fallback için)
  if (NEWS_API_KEY) {
    url.searchParams.set('api_key', NEWS_API_KEY);
    url.searchParams.set('key', NEWS_API_KEY);
  }

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
        // Timeout için AbortController
        signal: AbortSignal.timeout(API_TIMEOUT),
      });

      return withTimeout(fetchPromise, API_TIMEOUT);
    });

    if (!response.ok) {
      throw new NewsFetchError(
        `API request failed: ${response.status} ${response.statusText}`,
        'API_ERROR',
        new Error(`HTTP ${response.status}`)
      );
    }

    const data: NewsApiResponse = await response.json();

    // Basic validation
    if (!data || typeof data !== 'object') {
      throw new NewsFetchError('Invalid API response format', 'API_ERROR');
    }

    if (!data.items || !Array.isArray(data.items)) {
      throw new NewsFetchError('Invalid API response: items array missing', 'API_ERROR');
    }

    return data;
  } catch (error) {
    if (error instanceof NewsFetchError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new NewsFetchError('API request timeout', 'TIMEOUT_ERROR', error);
      }
      if (error.message.includes('fetch')) {
        throw new NewsFetchError('Network error while fetching news', 'NETWORK_ERROR', error);
      }
    }

    throw new NewsFetchError(
      'Unknown error while fetching news',
      'UNKNOWN_ERROR',
      error as Error
    );
  }
}

/**
 * Tek bir haberin detayını çeker (eğer API destekliyorsa)
 * @param newsId - Haber ID
 * @returns Haber detayı
 */
export async function fetchNewsById(newsId: string): Promise<NewsApiItem | null> {
  const url = new URL(`${NEWS_API_URL}/${newsId}`);

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
 * API health check
 * @returns API'nin erişilebilir olup olmadığı
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
