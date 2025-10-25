import type { NewsItem, NewsListResponse } from '../../types/news';

// Simple external API client for news
class ExternalApiClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_NEWS_API_URL || 'https://goen.onrender.com/api/v1';
    this.apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || 'karabey';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      next: {
        revalidate: 300, // 5 minutes cache for external API
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getNews(filters: {
    category?: string;
    tag?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<NewsListResponse> {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = `/news${queryString ? `?${queryString}` : ''}`;

    return this.request<NewsListResponse>(endpoint);
  }

  async getNewsById(id: string): Promise<NewsItem> {
    return this.request<NewsItem>(`/news/${id}`);
  }
}

// Export singleton instance
export const externalApiClient = new ExternalApiClient();

// Service functions
export const newsService = {
  async getNews(filters: Parameters<typeof externalApiClient.getNews>[0] = {}) {
    try {
      return await externalApiClient.getNews(filters);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      throw error;
    }
  },

  async getNewsById(id: string) {
    try {
      return await externalApiClient.getNewsById(id);
    } catch (error) {
      console.error(`Failed to fetch news ${id}:`, error);
      throw error;
    }
  },
};

// Export getNewsList as alias
export const getNewsList = newsService.getNews;

// Export getNewsById as alias for backward compatibility
export const getNewsById = newsService.getNewsById;
