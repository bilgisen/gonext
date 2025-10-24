Nextjs'de haber uygulaması yapacağım. Haberlerin filtrelenmesi, kategori, tag yapısı, hızlı arama, categoryv tag'e göre related news widgetleri etc çok önemli. Tanstack Query kurdum. Başka ne önerirsin?

Next.js'de haber uygulaması için harika bir başlangıç yapmışsın! TanStack Query ile birlikte şunları öneririm:

State Management & Data Fetching
Zustand veya Jotai - Global state için (filtreler, kullanıcı tercihleri vs.). TanStack Query ile çok iyi uyum sağlar.
nuqs - URL-based state management için. Filtreleri, kategori seçimlerini URL'de tutmak SEO ve kullanıcı deneyimi açısından önemli.
Arama & Filtreleme
Fuse.js veya MiniSearch - Client-side fuzzy search için
Backend'de Elasticsearch veya Algolia - Daha güçlü arama gerekiyorsa
use-debounce - Arama input'u için debounce işlemi
Performance & UX
next/image - Resim optimizasyonu (zaten Next.js'te var)
react-intersection-observer - Infinite scroll ve lazy loading için
@tanstack/react-virtual - Uzun listelerde virtualization
sharp - Image processing (backend)
SEO & Metadata
Next.js 14+ App Router kullanıyorsan metadata API'sini mutlaka kullan
next-sitemap - Otomatik sitemap oluşturma
JSON-LD structured data - Haber için çok önemli
Geliştirme Araçları
TypeScript - Zaten kullanıyorsan süper
Zod - API response validation
React Hook Form - Filtre formları için
date-fns veya day.js - Tarih işlemleri için
UI Önerileri
shadcn/ui veya Radix UI - Accessible komponentler
Tailwind CSS - Hızlı styling
framer-motion - Animasyonlar için
Öncelikli Mimari Öneriler
1. URL-based filtering sistemi kur - Tüm filtreleri URL'de tut (nuqs ile)

typescript
// Örnek: /haberler?kategori=teknoloji&tag=yapay-zeka&sayfa=2
2. İyi bir caching stratejisi - TanStack Query'de:

Haber listesi: staleTime: 5 dakika
Tekil haber: staleTime: 30 dakika
Related news: Aggressive caching
3. ISR veya SSG kullan - Statik sayfalar için Next.js'in revalidation özelliğini kullan

Hangi alanlar konusunda daha detaylı yardım istersin?


Tanstack Query'i en verimli nasıl kullanırım?

TanStack Query'i haber uygulamasında en verimli kullanmak için:

1. Query Keys Stratejisi (En Önemli!)
typescript
// lib/queryKeys.ts
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: NewsFilters) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const,
  related: (id: string) => [...newsKeys.all, 'related', id] as const,
  categories: () => [...newsKeys.all, 'categories'] as const,
  tags: () => [...newsKeys.all, 'tags'] as const,
}

// Kullanım
useQuery({
  queryKey: newsKeys.list({ category: 'teknoloji', page: 1 }),
  queryFn: () => fetchNews({ category: 'teknoloji', page: 1 })
})
2. Query Factory Pattern
typescript
// lib/queries/newsQueries.ts
export const newsQueries = {
  list: (filters: NewsFilters) => ({
    queryKey: newsKeys.list(filters),
    queryFn: () => fetchNews(filters),
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika (eski adı cacheTime)
  }),
  
  detail: (id: string) => ({
    queryKey: newsKeys.detail(id),
    queryFn: () => fetchNewsDetail(id),
    staleTime: 30 * 60 * 1000, // 30 dakika
    gcTime: 60 * 60 * 1000, // 1 saat
  }),
  
  related: (id: string, limit = 5) => ({
    queryKey: newsKeys.related(id),
    queryFn: () => fetchRelatedNews(id, limit),
    staleTime: 15 * 60 * 1000,
    enabled: !!id, // id varsa çalış
  }),
}

// Kullanım - çok temiz!
const { data } = useQuery(newsQueries.detail(newsId))
3. Prefetching - Kritik!
typescript
// app/haberler/page.tsx
export default function NewsListPage() {
  const queryClient = useQueryClient()
  const { data: news } = useQuery(newsQueries.list(filters))
  
  // Hover'da prefetch
  const handleMouseEnter = (newsId: string) => {
    queryClient.prefetchQuery(newsQueries.detail(newsId))
  }
  
  // Link'e tıklamadan önce data hazır!
  return (
    <div>
      {news?.map(item => (
        <Link 
          key={item.id}
          href={`/haber/${item.slug}`}
          onMouseEnter={() => handleMouseEnter(item.id)}
        >
          {item.title}
        </Link>
      ))}
    </div>
  )
}
4. Initial Data & Placeholder Data
typescript
// Server Component'ten gelen data'yı kullan
'use client'

export function NewsDetail({ initialData }: { initialData: News }) {
  const { data } = useQuery({
    ...newsQueries.detail(initialData.id),
    initialData, // Server'dan gelen data
    staleTime: Infinity, // İlk yüklemede fetch etme
  })
  
  return <article>{data.title}</article>
}

// veya Placeholder Data
const { data } = useQuery({
  ...newsQueries.list(filters),
  placeholderData: previousData => previousData, // Eski data'yı göster
})
5. Optimistic Updates (Favori, Bookmark için)
typescript
const addBookmark = useMutation({
  mutationFn: (newsId: string) => api.addBookmark(newsId),
  onMutate: async (newsId) => {
    // İptal et devam eden query'leri
    await queryClient.cancelQueries({ queryKey: newsKeys.detail(newsId) })
    
    // Önceki data'yı al
    const previous = queryClient.getQueryData(newsKeys.detail(newsId))
    
    // Optimistic update
    queryClient.setQueryData(newsKeys.detail(newsId), (old: News) => ({
      ...old,
      isBookmarked: true
    }))
    
    return { previous }
  },
  onError: (err, newsId, context) => {
    // Hata olursa geri al
    queryClient.setQueryData(newsKeys.detail(newsId), context?.previous)
  },
  onSettled: (newsId) => {
    // Her durumda refetch
    queryClient.invalidateQueries({ queryKey: newsKeys.detail(newsId) })
  }
})
6. Infinite Query - Liste için
typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: newsKeys.list(filters),
  queryFn: ({ pageParam = 1 }) => fetchNews({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage, pages) => {
    return lastPage.hasMore ? pages.length + 1 : undefined
  },
  initialPageParam: 1,
  staleTime: 5 * 60 * 1000,
})

// Intersection Observer ile otomatik yükleme
<div ref={loadMoreRef}>
  {isFetchingNextPage ? 'Yükleniyor...' : 'Daha fazla'}
</div>
7. QueryClient Setup - Provider'da
typescript
// app/providers.tsx
'use client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Default 1 dakika
      gcTime: 5 * 60 * 1000, // Default 5 dakika
      refetchOnWindowFocus: false, // Haber sitesinde genelde false
      refetchOnReconnect: true,
      retry: 1, // Hata durumunda 1 kez dene
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
8. Smart Invalidation
typescript
// Yeni haber yayınlandığında
queryClient.invalidateQueries({ 
  queryKey: newsKeys.lists() // Tüm listeleri invalidate et
})

// Kategori değiştiğinde
queryClient.invalidateQueries({ 
  queryKey: newsKeys.list({ category: 'teknoloji' }),
  exact: true // Sadece bu query'i
})

// Related news'i invalidate etme - agresif cache
// Detail sayfadan çıkınca otomatik garbage collect edilir
9. Select ile Data Transform
typescript
const { data: newsTitles } = useQuery({
  ...newsQueries.list(filters),
  select: (data) => data.map(news => news.title), // Sadece title'ları al
  // Component sadece title değişince re-render olur
})
10. Dependent Queries
typescript
// İlk kategori bilgisi lazım
const { data: category } = useQuery(newsQueries.categories())

// Sonra o kategoriye göre haberler
const { data: news } = useQuery({
  ...newsQueries.list({ category: category?.selected }),
  enabled: !!category?.selected, // Kategori hazır olunca çalış
})
Bonus: Custom Hook Pattern
typescript
// hooks/useNews.ts
export function useNews(filters: NewsFilters) {
  return useQuery(newsQueries.list(filters))
}

export function useNewsDetail(id: string) {
  return useQuery(newsQueries.detail(id))
}

export function useRelatedNews(newsId: string) {
  return useQuery(newsQueries.related(newsId))
}

// Kullanımı çok temiz
const { data, isLoading } = useNews({ category: 'spor' })
En önemli 3 şey:

Query key stratejisi - Hierarchical ve tutarlı
Prefetching - Kullanıcı hissetmeden data hazır
Doğru staleTime/gcTime - Gereksiz request atma
Başka bir konu hakkında detay ister misin?


Folder and files listesi yap (TS Query için) ai için description yaZ her files icin

src/
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   │   # Description: Axios veya fetch wrapper. Base URL, interceptors, error handling.
│   │   │   # Tüm API istekleri buradan geçer. Authorization header, retry logic içerir.
│   │   │
│   │   ├── endpoints.ts
│   │   │   # Description: API endpoint constants. `/api/news`, `/api/categories` gibi.
│   │   │   # Merkezi endpoint yönetimi, değişiklik tek yerden yapılır.
│   │   │
│   │   └── types.ts
│   │       # Description: API request/response type definitions. News, Category, Tag interfaces.
│   │       # Backend'den gelen/giden tüm data type'ları burada tanımlanır.
│   │
│   ├── queries/
│   │   ├── newsQueries.ts
│   │   │   # Description: News için query factory. list, detail, related query configs.
│   │   │   # queryKey, queryFn, staleTime, gcTime gibi tüm config burada.
│   │   │
│   │   ├── categoryQueries.ts
│   │   │   # Description: Category queries. Kategori listesi, kategori detayları.
│   │   │   # Cache süresi uzun tutulur çünkü kategoriler nadiren değişir.
│   │   │
│   │   ├── tagQueries.ts
│   │   │   # Description: Tag queries. Tag listesi, tag'e göre haber filtreleme.
│   │   │   # Popular tags için aggressive caching stratejisi.
│   │   │
│   │   └── searchQueries.ts
│   │       # Description: Search queries. Hızlı arama, autocomplete, search suggestions.
│   │       # Debounced search logic, staleTime kısa tutulur.
│   │
│   ├── queryKeys.ts
│   │   # Description: Hierarchical query key factory. Tüm query key'leri merkezi yönetim.
│   │   # Invalidation'da hangi cache'lerin silineceğini belirler. ['news'], ['news', 'list'], etc.
│   │
│   ├── queryClient.ts
│   │   # Description: QueryClient instance ve default configurations.
│   │   # Global staleTime, gcTime, retry, refetch politikaları burada.
│   │
│   └── services/
│       ├── newsService.ts
│       │   # Description: News CRUD operations. fetchNews, fetchNewsById, createNews, updateNews.
│       │   # API client kullanarak data fetch eder, business logic burada.
│       │
│       ├── categoryService.ts
│       │   # Description: Category operations. fetchCategories, fetchCategoryBySlug.
│       │   # Kategori bazlı filtreleme logic'i.
│       │
│       ├── tagService.ts
│       │   # Description: Tag operations. fetchTags, fetchNewsByTag.
│       │   # Tag cloud, popular tags gibi özel logic'ler.
│       │
│       └── searchService.ts
│           # Description: Search operations. searchNews, getSearchSuggestions, recentSearches.
│           # Elasticsearch veya Algolia integration burada.
│
├── hooks/
│   ├── queries/
│   │   ├── useNews.ts
│   │   │   # Description: News list hook. Filtering, pagination, sorting logic.
│   │   │   # useQuery wrapper, filters state management, URL sync.
│   │   │
│   │   ├── useNewsDetail.ts
│   │   │   # Description: Single news detail hook. Related news prefetching logic.
│   │   │   # View count increment, read time tracking gibi side effects.
│   │   │
│   │   ├── useInfiniteNews.ts
│   │   │   # Description: Infinite scroll için useInfiniteQuery wrapper.
│   │   │   # Auto-fetch on scroll, page management, hasMore logic.
│   │   │
│   │   ├── useRelatedNews.ts
│   │   │   # Description: Related news hook. Similarity algorithm'a göre öneriler.
│   │   │   # Category, tags based recommendation logic.
│   │   │
│   │   ├── useCategories.ts
│   │   │   # Description: Categories hook. Static data, long cache.
│   │   │   # Navigation menu, filter dropdown için kullanılır.
│   │   │
│   │   ├── useTags.ts
│   │   │   # Description: Tags hook. Popular tags, tag cloud data.
│   │   │   # Filter sidebar, tag suggestions için.
│   │   │
│   │   ├── useSearchNews.ts
│   │   │   # Description: Search hook with debouncing. Real-time search results.
│   │   │   # useDebounce integration, empty state handling.
│   │   │
│   │   └── useSearchSuggestions.ts
│   │       # Description: Autocomplete suggestions hook. Debounced query.
│   │       # As-you-type suggestions, recent searches, trending searches.
│   │
│   ├── mutations/
│   │   ├── useCreateNews.ts
│   │   │   # Description: Create news mutation. Optimistic updates, cache invalidation.
│   │   │   # Success/error toast notifications, redirect logic.
│   │   │
│   │   ├── useUpdateNews.ts
│   │   │   # Description: Update news mutation. Optimistic updates.
│   │   │   # Specific cache update, invalidation strategy.
│   │   │
│   │   ├── useDeleteNews.ts
│   │   │   # Description: Delete news mutation. Cache removal.
│   │   │   # Confirmation dialog, undo logic, toast feedback.
│   │   │
│   │   ├── useBookmarkNews.ts
│   │   │   # Description: Bookmark/unbookmark mutation. Optimistic UI update.
│   │   │   # User favorites list invalidation, instant feedback.
│   │   │
│   │   └── useLikeNews.ts
│   │       # Description: Like/unlike mutation. Optimistic count update.
│   │       # Real-time like count, debounced API call.
│   │
│   └── usePrefetchNews.ts
│       # Description: Prefetch utility hook. Hover, viewport trigger için.
│       # Link hover'da detail prefetch, related news prefetch logic.
│
├── components/
│   ├── news/
│   │   ├── NewsList.tsx
│   │   │   # Description: News list component. useNews hook kullanır.
│   │   │   # Loading states, empty states, error boundaries. Prefetch on hover.
│   │   │
│   │   ├── NewsCard.tsx
│   │   │   # Description: Single news card. Thumbnail, title, excerpt, metadata.
│   │   │   # onMouseEnter prefetch trigger, link navigation.
│   │   │
│   │   ├── NewsDetail.tsx
│   │   │   # Description: News detail page component. useNewsDetail hook.
│   │   │   # Content rendering, related news widget, share buttons.
│   │   │
│   │   ├── RelatedNewsWidget.tsx
│   │   │   # Description: Related news sidebar/section. useRelatedNews hook.
│   │   │   # Similarity-based recommendations, loading skeleton.
│   │   │
│   │   └── NewsFilters.tsx
│   │       # Description: Filter panel. Category, tag, date filters.
│   │       # URL state sync, filter reset, active filter indicators.
│   │
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   │   # Description: Search input with autocomplete. useSearchSuggestions hook.
│   │   │   # Debounced input, dropdown suggestions, keyboard navigation.
│   │   │
│   │   └── SearchResults.tsx
│   │       # Description: Search results list. useSearchNews hook.
│   │       # Highlight matching terms, empty state, search filters.
│   │
│   └── shared/
│       ├── InfiniteScroll.tsx
│       │   # Description: Infinite scroll wrapper. Intersection Observer.
│       │   # fetchNextPage trigger, loading indicator, end of list message.
│       │
│       ├── LoadingSpinner.tsx
│       │   # Description: Loading state component. Consistent loading UI.
│       │   # Skeleton screens, spinners, progress indicators.
│       │
│       └── ErrorBoundary.tsx
│           # Description: Error boundary for query errors. Retry button.
│           # User-friendly error messages, error logging.
│
├── app/
│   ├── providers.tsx
│   │   # Description: QueryClientProvider setup. ReactQueryDevtools.
│   │   # Global provider wrapper, development tools, persistent cache setup.
│   │
│   ├── haberler/
│   │   ├── page.tsx
│   │   │   # Description: News list page. Server Component, metadata.
│   │   │   # SEO optimization, initial data fetching, client component integration.
│   │   │
│   │   └── [slug]/
│   │       └── page.tsx
│   │           # Description: News detail page. Dynamic route, generateStaticParams.
│   │           # ISR setup, metadata generation, structured data (JSON-LD).
│   │
│   ├── kategori/
│   │   └── [slug]/
│   │       └── page.tsx
│   │           # Description: Category page. Filtered news list.
│   │           # Category-specific SEO, breadcrumbs, filter presets.
│   │
│   ├── etiket/
│   │   └── [slug]/
│   │       └── page.tsx
│   │           # Description: Tag page. Tag-filtered news list.
│   │           # Related tags widget, tag-specific metadata.
│   │
│   └── arama/
│       └── page.tsx
│           # Description: Search page. Search results, filters.
│           # Search query from URL params, search history.
│
├── utils/
│   ├── queryHelpers.ts
│   │   # Description: Query utility functions. Cache manipulation helpers.
│   │   # setQueryData, getQueryData wrappers, bulk invalidation utilities.
│   │
│   ├── filterHelpers.ts
│   │   # Description: Filter logic utilities. URL param parser.
│   │   # Filter object to query string, query string to filter object.
│   │
│   └── prefetchHelpers.ts
│       # Description: Prefetch strategies. Route-based prefetching.
│       # Predictive prefetch, background prefetch scheduling.
│
└── types/
    ├── news.ts
    │   # Description: News type definitions. News, NewsListItem, NewsDetail.
    │   # Category, Tag, Author, Comment types. TypeScript interfaces.
    │
    ├── filters.ts
    │   # Description: Filter type definitions. NewsFilters, SortOptions.
    │   # Pagination, date range, search query types.
    │
    └── api.ts
        # Description: API response wrapper types. ApiResponse<T>, PaginatedResponse<T>.
        # Error types, success types, metadata types.
Önemli Notlar:

lib/queries/ - Query factory pattern, her entity için ayrı dosya
hooks/queries/ - Component'lerde kullanılacak custom hooks
hooks/mutations/ - Create, update, delete işlemleri için
lib/services/ - API call logic, business logic
queryKeys.ts - Merkezi key management, invalidation kolaylığı
queryClient.ts - Global configuration, tek bir instance
Bu yapı ile:

✅ Type-safe API calls
✅ Merkezi cache yönetimi
✅ Kolay test edilebilir
✅ Reusable hooks
✅ Clean separation of concerns
Hangi dosyanın içeriğini detaylı görmek istersin?


Yukarda TS Query ile birlikte kullanabileceğim modüller bir yazımistin. Onları da yapıya entegre et. Haberler harici bir uygulamadan API ile çekilecek, drizzle ve neon DB yüklü.

src/
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   │   # Description: Axios instance. Base URL, interceptors, error handling, retry logic.
│   │   │   # External news API için authentication, rate limiting, timeout config.
│   │   │
│   │   ├── endpoints.ts
│   │   │   # Description: External API endpoint constants. News provider endpoints.
│   │   │   # /api/v1/news, /api/v1/categories gibi external API routes.
│   │   │
│   │   └── types.ts
│   │       # Description: API request/response types. External provider data types.
│   │       # News, Category, Tag interfaces external API format'ına göre.
│   │
│   ├── db/
│   │   ├── schema.ts
│   │   │   # Description: Drizzle ORM schema definitions. Users, bookmarks, preferences, search_history.
│   │   │   # Local data için database schema, foreign keys, indexes, relations.
│   │   │
│   │   ├── index.ts
│   │   │   # Description: Drizzle client initialization. Neon DB connection.
│   │   │   # Database instance export, connection pooling, environment config.
│   │   │
│   │   ├── migrations/
│   │   │   # Description: Database migration files. Auto-generated by drizzle-kit.
│   │   │   # Schema changes history, up/down migrations.
│   │   │
│   │   └── queries/
│   │       ├── userQueries.ts
│   │       │   # Description: User related database queries. Drizzle query builders.
│   │       │   # User CRUD, preferences fetch/update, bookmarks management.
│   │       │
│   │       ├── bookmarkQueries.ts
│   │       │   # Description: Bookmark operations. Save/unsave news, fetch user bookmarks.
│   │       │   # Paginated bookmark list, bookmark counts, duplicate check.
│   │       │
│   │       ├── searchHistoryQueries.ts
│   │       │   # Description: Search history tracking. Save searches, fetch recent searches.
│   │       │   # Popular searches analytics, user-specific history, cleanup old records.
│   │       │
│   │       └── readingHistoryQueries.ts
│   │           # Description: Reading history tracking. Track viewed news, reading time.
│   │           # Recently viewed, reading statistics, recommendation data.
│   │
│   ├── queries/
│   │   ├── newsQueries.ts
│   │   │   # Description: News query factory. External API calls için TanStack Query config.
│   │   │   # list, detail, related query configs, staleTime 5min, gcTime 10min.
│   │   │
│   │   ├── categoryQueries.ts
│   │   │   # Description: Category queries. External API'den kategori çekme.
│   │   │   # Long cache (30min), rarely changes, aggressive caching.
│   │   │
│   │   ├── tagQueries.ts
│   │   │   # Description: Tag queries. External API tag endpoints.
│   │   │   # Popular tags, tag-based filtering, medium cache (15min).
│   │   │
│   │   ├── searchQueries.ts
│   │   │   # Description: External API search queries. Debounced search.
│   │   │   # Short staleTime (2min), search suggestions, autocomplete.
│   │   │
│   │   ├── bookmarkQueries.ts
│   │   │   # Description: Local DB bookmark queries. TanStack Query wrappers.
│   │   │   # User bookmarks from Neon DB, real-time sync, optimistic updates.
│   │   │
│   │   └── userQueries.ts
│   │       # Description: User data queries. Preferences, history from local DB.
│   │       # User profile, settings, personalization data.
│   │
│   ├── queryKeys.ts
│   │   # Description: Hierarchical query key factory. External API + local DB keys.
│   │   # news: external, bookmarks: local, combined invalidation strategy.
│   │
│   ├── queryClient.ts
│   │   # Description: QueryClient instance. Global config, persister setup.
│   │   # Default options, retry logic, persister for offline support.
│   │
│   ├── services/
│   │   ├── newsService.ts
│   │   │   # Description: News operations. External API fetch, data transformation.
│   │   │   # Map external API response to internal types, error handling.
│   │   │
│   │   ├── categoryService.ts
│   │   │   # Description: Category service. External API kategori operations.
│   │   │   # Category tree building, slug generation, parent-child relations.
│   │   │
│   │   ├── tagService.ts
│   │   │   # Description: Tag service. External API tag operations.
│   │   │   # Tag normalization, tag cloud generation, related tags.
│   │   │
│   │   ├── searchService.ts
│   │   │   # Description: Search service. External search API integration.
│   │   │   # MiniSearch for client-side search fallback, query building.
│   │   │
│   │   ├── bookmarkService.ts
│   │   │   # Description: Bookmark service. Local DB operations via Drizzle.
│   │   │   # Add/remove bookmarks, sync with external news data.
│   │   │
│   │   └── userService.ts
│   │       # Description: User service. Local DB user operations.
│   │       # Preferences management, reading statistics, personalization.
│   │
│   ├── validation/
│   │   ├── newsSchema.ts
│   │   │   # Description: Zod schemas for news data validation.
│   │   │   # External API response validation, type-safe parsing.
│   │   │
│   │   ├── filterSchema.ts
│   │   │   # Description: Zod schemas for filter validation.
│   │   │   # URL params validation, query string parsing.
│   │   │
│   │   └── userSchema.ts
│   │       # Description: Zod schemas for user data.
│   │       # Form validation, preferences validation, input sanitization.
│   │
│   ├── state/
│   │   ├── filterStore.ts
│   │   │   # Description: Zustand store for filter state. Category, tags, date range.
│   │   │   # Persist filters to URL via nuqs, global filter state management.
│   │   │
│   │   ├── userStore.ts
│   │   │   # Description: Zustand store for user state. Auth, preferences, theme.
│   │   │   # Persistent store, localStorage sync, user session management.
│   │   │
│   │   └── searchStore.ts
│   │       # Description: Zustand store for search state. Recent searches, suggestions.
│   │       # Temporary search state, query history, autocomplete cache.
│   │
│   └── cache/
│       ├── persister.ts
│       │   # Description: TanStack Query persister setup. IndexedDB persistence.
│       │   # Offline support, cache restore on reload, selective persistence.
│       │
│       └── cacheStrategies.ts
│           # Description: Cache invalidation strategies. Smart cache management.
│           # Time-based, dependency-based invalidation, cache warming.
│
├── hooks/
│   ├── queries/
│   │   ├── useNews.ts
│   │   │   # Description: News list hook. External API + filtering + URL sync (nuqs).
│   │   │   # useQuery + useQueryState (nuqs) for URL-based filters.
│   │   │
│   │   ├── useNewsDetail.ts
│   │   │   # Description: Single news detail. External API fetch.
│   │   │   # Prefetch related, track reading history to local DB.
│   │   │
│   │   ├── useInfiniteNews.ts
│   │   │   # Description: Infinite scroll. useInfiniteQuery + Intersection Observer.
│   │   │   # Auto-fetch next page, @tanstack/react-virtual for virtualization.
│   │   │
│   │   ├── useRelatedNews.ts
│   │   │   # Description: Related news. External API similarity endpoint.
│   │   │   # Category/tag based recommendations, aggressive caching.
│   │   │
│   │   ├── useCategories.ts
│   │   │   # Description: Categories from external API. Long cache.
│   │   │   # Static-like data, used in navigation, filter dropdowns.
│   │   │
│   │   ├── useTags.ts
│   │   │   # Description: Tags from external API. Medium cache.
│   │   │   # Tag cloud, popular tags, trending tags.
│   │   │
│   │   ├── useSearchNews.ts
│   │   │   # Description: Search with use-debounce. External API search.
│   │   │   # Debounced query, MiniSearch fallback for offline.
│   │   │
│   │   ├── useSearchSuggestions.ts
│   │   │   # Description: Autocomplete with use-debounce. External API.
│   │   │   # Real-time suggestions, recent searches from local DB.
│   │   │
│   │   ├── useBookmarks.ts
│   │   │   # Description: User bookmarks from local DB (Drizzle).
│   │   │   # TanStack Query wrapper for DB queries, real-time updates.
│   │   │
│   │   ├── useUserPreferences.ts
│   │   │   # Description: User preferences from local DB.
│   │   │   # Theme, language, notification settings, personalization.
│   │   │
│   │   └── useReadingHistory.ts
│   │       # Description: Reading history from local DB.
│   │       # Recently viewed news, reading time stats, recommendations.
│   │
│   ├── mutations/
│   │   ├── useAddBookmark.ts
│   │   │   # Description: Add bookmark mutation. Local DB insert via Drizzle.
│   │   │   # Optimistic update, toast notification, cache invalidation.
│   │   │
│   │   ├── useRemoveBookmark.ts
│   │   │   # Description: Remove bookmark mutation. Local DB delete.
│   │   │   # Optimistic update, undo functionality, instant feedback.
│   │   │
│   │   ├── useUpdatePreferences.ts
│   │   │   # Description: Update user preferences mutation. Local DB.
│   │   │   # Settings update, theme change, language switch.
│   │   │
│   │   ├── useTrackReading.ts
│   │   │   # Description: Track reading mutation. Save to local DB.
│   │   │   # Reading time tracking, view count, analytics data.
│   │   │
│   │   └── useSaveSearch.ts
│   │       # Description: Save search query mutation. Search history to DB.
│   │       # Search analytics, personalized suggestions, trending queries.
│   │
│   ├── usePrefetchNews.ts
│   │   # Description: Prefetch utility. Hover, viewport intersection triggers.
│   │   # queryClient.prefetchQuery wrapper, smart prefetch logic.
│   │
│   ├── useDebounce.ts
│   │   # Description: Re-export from use-debounce. Debounce hook for search.
│   │   # 300ms delay for search input, performance optimization.
│   │
│   └── useIntersectionObserver.ts
│       # Description: Intersection Observer hook. Infinite scroll, lazy loading.
│       # react-intersection-observer wrapper, viewport detection.
│
├── components/
│   ├── news/
│   │   ├── NewsList.tsx
│   │   │   # Description: News list with filters. useNews + nuqs for URL sync.
│   │   │   # Filter panel integration, loading states, empty states.
│   │   │
│   │   ├── NewsCard.tsx
│   │   │   # Description: Single news card. next/image, prefetch on hover.
│   │   │   # Bookmark button, share button, reading time indicator.
│   │   │
│   │   ├── NewsDetail.tsx
│   │   │   # Description: News detail page. useNewsDetail, related news widget.
│   │   │   # Content rendering, social share, bookmark action.
│   │   │
│   │   ├── RelatedNewsWidget.tsx
│   │   │   # Description: Related news sidebar. useRelatedNews hook.
│   │   │   # Similarity-based recommendations, loading skeleton.
│   │   │
│   │   ├── NewsFilters.tsx
│   │   │   # Description: Filter panel. React Hook Form + nuqs.
│   │   │   # Category, tag, date filters, URL state sync.
│   │   │
│   │   ├── InfiniteNewsList.tsx
│   │   │   # Description: Infinite scroll news list. useInfiniteNews + virtualization.
│   │   │   # @tanstack/react-virtual for performance, load more button.
│   │   │
│   │   └── BookmarkButton.tsx
│   │       # Description: Bookmark toggle button. useAddBookmark, useRemoveBookmark.
│   │       # Optimistic UI, loading state, success/error feedback.
│   │
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   │   # Description: Search input with autocomplete. useDebounce + useSearchSuggestions.
│   │   │   # Dropdown suggestions, keyboard navigation, recent searches.
│   │   │
│   │   ├── SearchResults.tsx
│   │   │   # Description: Search results list. useSearchNews hook.
│   │   │   # Highlighted matches, filter chips, empty state.
│   │   │
│   │   └── SearchSuggestions.tsx
│   │       # Description: Autocomplete dropdown. Recent + trending + live suggestions.
│   │       # Click handling, keyboard navigation, suggestion categories.
│   │
│   ├── filters/
│   │   ├── CategoryFilter.tsx
│   │   │   # Description: Category dropdown/checkbox. useCategories + nuqs.
│   │   │   # Multi-select, tree structure, URL sync.
│   │   │
│   │   ├── TagFilter.tsx
│   │   │   # Description: Tag filter component. useTags + nuqs.
│   │   │   # Tag cloud, popular tags, multi-select.
│   │   │
│   │   ├── DateRangeFilter.tsx
│   │   │   # Description: Date range picker. date-fns for formatting.
│   │   │   # Calendar component, preset ranges, URL sync.
│   │   │
│   │   └── SortOptions.tsx
│   │       # Description: Sort dropdown. Date, relevance, popularity.
│   │       # nuqs for URL state, sort direction toggle.
│   │
│   ├── user/
│   │   ├── BookmarkList.tsx
│   │   │   # Description: User's bookmarked news. useBookmarks hook.
│   │   │   # Paginated list, remove action, empty state.
│   │   │
│   │   ├── ReadingHistory.tsx
│   │   │   # Description: Recently viewed news. useReadingHistory hook.
│   │   │   # Timeline view, clear history action, statistics.
│   │   │
│   │   └── PreferencesPanel.tsx
│   │       # Description: User settings panel. useUserPreferences + mutations.
│   │       # Theme toggle, language select, notification settings.
│   │
│   └── shared/
│       ├── InfiniteScroll.tsx
│       │   # Description: Infinite scroll wrapper. useIntersectionObserver.
│       │   # Load more trigger, loading indicator, end message.
│       │
│       ├── VirtualList.tsx
│       │   # Description: Virtualized list wrapper. @tanstack/react-virtual.
│       │   # Performance for long lists, dynamic item heights.
│       │
│       ├── LoadingSpinner.tsx
│       │   # Description: Loading states. Skeleton screens with Tailwind.
│       │   # Consistent loading UI, spinner variants.
│       │
│       ├── ErrorBoundary.tsx
│       │   # Description: Error boundary. Retry button, error logging.
│       │   # User-friendly error messages, fallback UI.
│       │
│       └── Image.tsx
│           # Description: Optimized image component. next/image wrapper.
│           # Lazy loading, placeholder, error fallback.
│
├── app/
│   ├── providers.tsx
│   │   # Description: All providers. QueryClientProvider + persister.
│   │   # Zustand providers, theme provider, ReactQueryDevtools.
│   │
│   ├── api/
│   │   ├── bookmarks/
│   │   │   └── route.ts
│   │   │       # Description: Bookmark API route. Local DB operations via Drizzle.
│   │   │       # GET, POST, DELETE endpoints for bookmarks.
│   │   │
│   │   ├── preferences/
│   │   │   └── route.ts
│   │   │       # Description: User preferences API route. Drizzle queries.
│   │   │       # GET, PUT endpoints for user settings.
│   │   │
│   │   └── history/
│   │       └── route.ts
│   │           # Description: Reading history API route. Track views.
│   │           # POST for tracking, GET for fetching history.
│   │
│   ├── haberler/
│   │   ├── page.tsx
│   │   │   # Description: News list page. Server Component, HydrationBoundary.
│   │   │   # Prefetch initial data, SEO metadata, client component hydration.
│   │   │
│   │   └── [slug]/
│   │       └── page.tsx
│   │           # Description: News detail page. generateStaticParams, ISR.
│   │           # Metadata generation, JSON-LD structured data, prefetch related.
│   │
│   ├── kategori/
│   │   └── [slug]/
│   │       └── page.tsx
│   │           # Description: Category page. Filtered news, nuqs integration.
│   │           # Category metadata, breadcrumbs, pre-filtered state.
│   │
│   ├── etiket/
│   │   └── [slug]/
│   │       └── page.tsx
│   │           # Description: Tag page. Tag-filtered news list.
│   │           # Tag metadata, related tags widget, SEO optimization.
│   │
│   ├── arama/
│   │   └── page.tsx
│   │       # Description: Search results page. nuqs for query param.
│   │       # Search query from URL, filter panel, save search to DB.
│   │
│   ├── hesabim/
│   │   ├── kayitli/
│   │   │   └── page.tsx
│   │   │       # Description: Bookmarks page. User's saved news.
│   │   │       # Protected route, bookmark list component.
│   │   │
│   │   └── gecmis/
│   │       └── page.tsx
│   │           # Description: Reading history page. Recently viewed.
│   │           # Timeline view, statistics, clear history action.
│   │
│   └── layout.tsx
│       # Description: Root layout. Providers, navigation, footer.
│       # Global styles, font setup, metadata template.
│
├── utils/
│   ├── queryHelpers.ts
│   │   # Description: Query utilities. Cache manipulation helpers.
│   │   # setQueryData wrappers, bulk invalidation, prefetch utilities.
│   │
│   ├── filterHelpers.ts
│   │   # Description: Filter utilities. nuqs integration helpers.
│   │   # Filter to query string, parse query params, Zod validation.
│   │
│   ├── prefetchHelpers.ts
│   │   # Description: Prefetch strategies. Route-based, hover-based.
│   │   # Predictive prefetch, background scheduling.
│   │
│   ├── dateHelpers.ts
│   │   # Description: Date utilities using date-fns.
│   │   # Format dates, relative time, date range calculations.
│   │
│   ├── urlHelpers.ts
│   │   # Description: URL utilities. Slug generation, query params.
│   │   # nuqs helpers, URL normalization, SEO-friendly URLs.
│   │
│   └── searchHelpers.ts
│       # Description: Search utilities. MiniSearch setup, indexing.
│       # Client-side search fallback, query normalization, highlighting.
│
├── types/
│   ├── news.ts
│   │   # Description: News types. External API + internal types.
│   │   # News, Category, Tag, Author interfaces, mapped types.
│   │
│   ├── filters.ts
│   │   # Description: Filter types. NewsFilters, SortOptions, DateRange.
│   │   # Type-safe filter objects, Zod schemas export.
│   │
│   ├── user.ts
│   │   # Description: User types. Local DB schema types from Drizzle.
│   │   # User, Bookmark, Preference, History types.
│   │
│   └── api.ts
│       # Description: API wrapper types. ApiResponse<T>, Paginated<T>.
│       # Error types, success types, metadata types.
│
├── config/
│   ├── api.ts
│   │   # Description: API configuration. External news API credentials.
│   │   # Base URL, API keys, timeout, retry config from env.
│   │
│   ├── database.ts
│   │   # Description: Database config. Neon DB connection string.
│   │   # Connection pool settings, environment variables.
│   │
│   └── cache.ts
│       # Description: Cache configuration. staleTime, gcTime defaults.
│       # Per-entity cache strategies, persister config.
│
├── middleware.ts
│   # Description: Next.js middleware. Auth check, rate limiting.
│   # Protected routes, API rate limiting, request logging.
│
├── drizzle.config.ts
│   # Description: Drizzle Kit configuration. Migration settings.
│   # Schema path, output directory, database connection.
│
└── env.ts
    # Description: Environment variables validation with Zod.
    # Type-safe env vars, validation on startup, error messages.
Yeni Eklenen Modüller:

1. nuqs (URL State)

lib/state/filterStore.ts - Zustand + nuqs entegrasyonu
utils/filterHelpers.ts - URL sync utilities
Her filter component'te nuqs hooks kullanımı
2. use-debounce

hooks/useDebounce.ts - Re-export
SearchBar.tsx, SearchSuggestions.tsx - Search input debouncing
3. Drizzle + Neon DB

lib/db/ - Schema, migrations, queries
Local data: bookmarks, user preferences, reading history, search history
External API için cache değil, kullanıcı data'sı için DB
4. Zod Validation

lib/validation/ - Tüm schema'lar
API response validation
Form validation
URL params validation
5. date-fns

utils/dateHelpers.ts - Date formatting utilities
DateRangeFilter.tsx - Date operations
6. React Hook Form

NewsFilters.tsx - Form state management
PreferencesPanel.tsx - Settings form
7. @tanstack/react-virtual

VirtualList.tsx - Virtualized lists
InfiniteNewsList.tsx - Performance optimization
8. react-intersection-observer

useIntersectionObserver.ts - Custom hook
InfiniteScroll.tsx - Auto-load trigger
9. MiniSearch

utils/searchHelpers.ts - Client-side search setup
searchService.ts - Fallback search logic
10. Query Persister

lib/cache/persister.ts - IndexedDB persistence
providers.tsx - Persister setup
Mimari Kararlar:

✅ External API → TanStack Query cache (geçici) ✅ User Data → Drizzle + Neon DB (kalıcı) ✅ Filters → nuqs (URL) + Zustand (global state) ✅ Search → External API (primary) + MiniSearch (fallback) ✅ Validation → Zod (everywhere) ✅ Dates → date-fns (formatting) ✅ Forms → React Hook Form + Zod ✅ Lists → Virtualization (@tanstack/react-virtual) ✅ Infinite Scroll → react-intersection-observer