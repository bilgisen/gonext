# News Fetch System

Perfect news fetching system for GoNext haber uygulaması. External API'den haberleri çeker, duplicate kontrolü yapar, kategorileri otomatik tespit eder, image processing yapar ve database'e kaydeder.

## 🚀 Özellikler

- ✅ **Smart Duplicate Detection**: `source_guid` ve `source_id` ile duplicate kontrolü
- ✅ **Automatic Category Extraction**: URL'den kategori tespiti (örn: `/sirketler/` → "Business")
- ✅ **Image Processing**: Sharp ile image optimization ve Netlify CDN upload
- ✅ **Slug Generation**: SEO-friendly URL slug'ları (Türkçe karakter desteği)
- ✅ **Error Handling**: Comprehensive error handling ve retry logic
- ✅ **Performance Monitoring**: Memory usage ve performance tracking
- ✅ **Batch Processing**: Large dataset'ler için batch processing
- ✅ **Validation**: Zod ile type-safe validation

## 📁 Dosya Yapısı

```
lib/news/
├── index.ts              # Main orchestrator functions
├── types.ts              # TypeScript types ve schemas
├── api-client.ts         # External API client
├── category-utils.ts     # Category extraction utilities
├── slug-utils.ts         # Slug generation utilities
├── duplicate-check.ts    # Duplicate detection
├── image-processor.ts    # Image processing ve CDN upload
├── db-operations.ts      # Database operations
└── error-handler.ts      # Error handling ve logging
```

## 🛠️ Kurulum ve Konfigürasyon

### 1. Environment Variables

```bash
# .env dosyasını oluştur
npm run setup:env

# Veya manuel olarak .env dosyası oluştur:
cp .env.example .env
```

`.env` dosyasında gerekli değişkenler:

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
# Migration'ları çalıştır (eğer yoksa)
npx drizzle-kit migrate
```

## 💻 Kullanım

### CLI Tools

```bash
# Environment setup
npm run setup:env

# System status kontrolü
npm run news:fetch -- --status

# 50 haber çek (incremental)
npm run news:fetch

# 100 haber çek
npm run news:fetch -- --limit 100

# Batch processing (200 haber, 25'er batch)
npm run news:fetch -- --limit 200 --batch 25

# Force fetch (duplicate kontrolü olmadan)
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
# Test script'i çalıştır
npm run test:news
```

## 🔧 API Response Format

API'den beklenen format:

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

Haberler aşağıdaki tablolara kaydedilir:

- `news`: Ana haber tablosu
- `categories`: Kategoriler (otomatik oluşturulur)
- `tags`: Etiketler (otomatik oluşturulur)
- `media`: Image'lar (Netlify CDN)
- `sources`: Haber kaynakları
- `import_logs`: Import geçmişi

## 🔍 Kategori Mapping

URL'den otomatik kategori tespiti:

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

Sistem şu error türlerini handle eder:

- `NewsFetchError`: Genel API hataları
- `ValidationError`: Validation hataları
- `DuplicateError`: Duplicate haberler
- `ImageFetchError`: Image processing hataları

## 🔄 Retry Logic

Otomatik retry mechanism:

```typescript
// 3 kez dene, exponential backoff ile
await ErrorHandler.withRetry(
  () => fetchNewsFromApi(),
  'news_fetch',
  3, // max retries
  1000 // initial delay
);
```

## 🚨 Rate Limiting

API'yi yormamak için built-in rate limiting:

```typescript
// Batch'ler arasında 2 saniye bekle
await new Promise(resolve => setTimeout(resolve, 2000));
```

## 🖼️ Image Processing

Image'lar otomatik olarak:

1. Sharp ile optimize edilir
2. Netlify CDN'e upload edilir
3. Database'e metadata ile kaydedilir

```typescript
const result = await processNewsImage(
  'https://example.com/image.jpg',
  'News Title',
  { width: 800, height: 600, quality: 85 }
);
```

## 📈 Performance

- **Memory Monitoring**: Critical memory threshold detection
- **Performance Metrics**: Operation timing ve success rates
- **Batch Processing**: Large dataset'ler için optimized
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

- [ ] Unit tests ekleme
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
