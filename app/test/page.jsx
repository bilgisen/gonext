import Link from 'next/link';
import { neon } from '@netlify/neon';

async function getNewsData() {
  try {
    // Only connect if NETLIFY_DATABASE_URL is available
    if (!process.env.NETLIFY_DATABASE_URL) {
      return { newsData: [], dbError: 'NETLIFY_DATABASE_URL not configured' };
    }

    // Test database connection using @netlify/neon
    // neon() automatically uses NETLIFY_DATABASE_URL environment variable
    const sql = neon();
    const [news] = await sql`SELECT * FROM news LIMIT 5`;

    const newsData = news ? (Array.isArray(news) ? news : [news]) : [];
    return { newsData, dbError: null };
  } catch (error) {
    console.error('Database connection error:', error);
    return { newsData: [], dbError: error.message };
  }
}

export default async function TestPage() {
  const { newsData, dbError } = await getNewsData();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test Sayfası - Database Haberler
          </h1>
          <p className="text-gray-600">
            Database&apos;den çekilen haberler listesi
          </p>
        </div>

        {/* Database Connection Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Database Bağlantısı
          </h2>

          {dbError ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800 mb-2">❌ Bağlantı Hatası</h3>
              <p className="text-red-700 text-sm">{dbError}</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Bağlantı Başarılı</h3>
              <p className="text-green-700 text-sm">
                Database&apos;e başarıyla bağlandı. @netlify/neon kullanıldı.
              </p>
            </div>
          )}
        </div>

        {/* News Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📰 Haberler ({newsData.length})
          </h2>

          {newsData.length > 0 ? (
            <div className="space-y-4">
              {newsData.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.content?.substring(0, 100)}...</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Status: {item.status}</span>
                    <span>ID: {item.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz haber bulunmuyor.</p>
              <p className="text-sm text-gray-400 mt-2">
                npm run news:fetch komutu ile haber çekebilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* Simple Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✅ Sayfa Çalışıyor!
          </h2>
          <p className="text-gray-600 mb-4">
            Next.js sayfası başarıyla render edildi.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">🔧 Test Komutları</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-2 py-1 rounded">npm run test:db</code>
                <span className="text-blue-700">Database test</span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-2 py-1 rounded">npm run news:fetch</code>
                <span className="text-blue-700">Haber çekme</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
