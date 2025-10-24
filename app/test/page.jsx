import Link from 'next/link';

export default function TestPage() {
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

        {/* Simple Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✅ Sayfa Çalışıyor!
          </h2>
          <p className="text-gray-600 mb-4">
            Next.js sayfası başarıyla render edildi.
          </p>

          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h3 className="font-semibold text-green-800 mb-2">📊 Database Test</h3>
            <p className="text-green-700 text-sm">
              Database&apos;den haber çekmek için test script&apos;i çalıştırın:
            </p>
            <code className="block mt-2 bg-gray-100 p-2 rounded text-sm">
              npm run test:db
            </code>
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
