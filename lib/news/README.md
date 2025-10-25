# News Fetch System

Perfect news fetching system for GoNext news application. Fetches news from external API, performs duplicate checking, automatically detects categories, processes images, and saves to database.

## 🚀 Features

- ✅ **Smart Duplicate Detection**: Duplicate checking with `source_guid` and `source_id`
- ✅ **Automatic Category Extraction**: Category detection from URLs (e.g: `/sirketler/` → "Business")
- ✅ **Image Processing**: Image optimization and Netlify CDN upload with Sharp
- ✅ **Slug Generation**: SEO-friendly URL slugs (Turkish character support)
- ✅ **Error Handling**: Comprehensive error handling and retry logic
- ✅ **Performance Monitoring**: Memory usage and performance tracking
- ✅ **Batch Processing**: Batch processing for large datasets
- ✅ **Validation**: Type-safe validation with Zod

## 📁 File Structure

```
lib/news/
├── index.ts              # Main orchestrator functions
├── types.ts              # TypeScript types and schemas
├── api-client.ts         # External API client
├── category-utils.ts     # Category extraction utilities
├── slug-utils.ts         # Slug generation utilities
├── duplicate-check.ts    # Duplicate detection
├── image-processor.ts    # Image processing and CDN upload
├── db-operations.ts      # Database operations
└── error-handler.ts      # Error handling and logging
```

## 🛠️ Installation and Configuration

### 1. Environment Variables

```bash
# Create .env file
npm run setup:env

# Or manually create .env file:
cp .env.example .env
```

Required variables in `.env` file:

```env
# Required
NEWS_API_URL=https://goen.onrender.com/api/v1/news
NETLIFY_DATABASE_URL=your_neon_database_url

# Optional
LOG_LEVEL=1  # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
NETLIFY_BLOBS_ACCESS_TOKEN=your_netlify_token
API_RATE_LIMIT=50
BATCH_DELAY=2000
```

### 2. Database Migration

```bash
# Run migrations (if not exists)
npx drizzle-kit migrate
```

## 💻 Usage

### CLI Tools

```bash
# Environment setup
npm run setup:env

# System status check
npm run news:fetch -- --status

# Fetch 50 news (incremental)
npm run news:fetch

# Fetch 100 news
npm run news:fetch -- --limit 100

# Batch processing (200 news, 25 per batch)
npm run news:fetch -- --limit 200 --batch 25

# Force fetch (without duplicate checking)
npm run news:fetch -- --force --limit 50

# Help
npm run news:fetch -- --help
```

### Programmatic Usage

```typescript
import { fetchNewsIncremental, fetchNewsBatch } from '@/lib/news';

// Incremental fetch (recommended)
const result = await fetchNewsIncremental({
  limit: 100,
  offset: 0,
  force: false  // Skip duplicates
});

// Batch processing
const results = await fetchNewsBatch(500, 50);

// System status
const status = await getSystemStatus();
```

### Test

```bash
# Run test script
npm run test:news
```

## 🔧 API Response Format

Expected format from API:

```typescript
{
  "items": [
    {
      "id": "1761277130386686308",
      "source_guid": "9e6ecfcf12ed9d162693ab0207857a54ecbd6a22cfc901e619101419624c3532",
      "seo_title": "Intel's Q3 Revenue Surges",
      "seo_description": "Intel reports robust Q3 2023 results...",
      "tldr": ["Key point 1", "Key point 2"],
      "content_md": "**SANTA CLARA, CA** – Intel has reported...",
      "category": "general", // optional
      "tags": ["Intel", "Q3 Earnings", "Technology"],
      "image": "https://example.com/image.jpg",
      "image_title": "Intel Microchip",
      "image_desc": "",
      "original_url": "https://www.dunya.com/sirketler/intel-haberi",
      "file_path": "data/processed/2025/10/24/1761277130.json",
      "created_at": "2025-10-24T06:38:50.386689378+03:00",
      "published_at": "0001-01-01T00:00:00Z",
      "updated_at": "2025-10-24T06:38:50.386870013+03:00"
    }
  ]
}
```

## 🗄️ Database Schema

News are saved to the following tables:

- `news`: Main news table
- `categories`: Categories (auto-generated)
- `tags`: Tags (auto-generated)
- `media`: Images (Netlify CDN)
- `sources`: News sources
- `import_logs`: Import history

## 🔍 Category Mapping

Automatic category detection from URLs:

| URL Pattern | Category |
|-------------|----------|
| `/sirketler/` | Business |
| `/politika/` | Politics |
| `/teknoloji/` | Technology |
| `/spor/` | Sports |
| `/saglik/` | Health |
| `/bilim/` | Science |
| ... | ... |

## 📊 Monitoring

```typescript
import { getSystemStatus, PerformanceMonitor, logger } from '@/lib/news';

// System status
const status = await getSystemStatus();
console.log('API Healthy:', status.apiHealthy);
console.log('Total News:', status.totalNews);

// Performance metrics
const metrics = PerformanceMonitor.getMetrics();
console.log(metrics);

// Logs
const errorLogs = logger.getLogs(LogLevel.ERROR);
```

## 🐛 Error Handling

System handles these error types:

- `NewsFetchError`: General API errors
- `ValidationError`: Validation errors
- `DuplicateError`: Duplicate news articles
- `ImageFetchError`: Image processing errors

## 🔄 Retry Logic

Automatic retry mechanism:

```typescript
// Retry 3 times with exponential backoff
await ErrorHandler.withRetry(
  () => fetchNewsFromApi(),
  'news_fetch',
  3, // max retries
  1000 // initial delay
);
```

## 🚨 Rate Limiting

Built-in rate limiting to avoid overwhelming the API:

```typescript
// Wait 2 seconds between batches
await new Promise(resolve => setTimeout(resolve, 2000));
```

## 🖼️ Image Processing

Images are automatically:

1. Optimized with Sharp
2. Uploaded to Netlify CDN
3. Saved to database with metadata

```typescript
const result = await processNewsImage(
  'https://example.com/image.jpg',
  'News Title',
  { width: 800, height: 600, quality: 85 }
);
```

## 📈 Performance

- **Memory Monitoring**: Critical memory threshold detection
- **Performance Metrics**: Operation timing and success rates
- **Batch Processing**: Optimized for large datasets
- **Connection Pooling**: Database connection optimization

## 🔧 Development

```bash
# Type checking
npm run lint

# Test
npm run test:news

# Build
npm run build
```

## 📝 TODO

- [ ] Add unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Admin dashboard for monitoring
- [ ] Webhook support for real-time updates
- [ ] Advanced filtering options

## 🚀 Production Deployment

```bash
# Environment setup
npm run setup:env

# Database migration
npx drizzle-kit migrate

# Test
npm run test:news

# Deploy
npm run build
npm start

# Or use CLI for scheduled fetching
npm run news:fetch -- --limit 100 --batch 25
```
