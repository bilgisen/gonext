import { NextResponse } from 'next/server';
import { fetchNewsIncremental, getSystemStatus, type ImportResult } from '@/lib/news';

// Type for our simplified response
type FetchNewsResponse = Omit<ImportResult, 'errorDetails'> & {
  message: string;
  error?: string;
};

// Harici cron servislerinden gelen istekleri doğrulamak için API anahtarı kontrolü
const isValidApiKey = (req: Request): boolean => {
  // Geliştirme ortamında her zaman true döndür
  if (process.env.NODE_ENV !== 'production') return true;
  
  const authHeader = req.headers.get('authorization');
  const apiKey = authHeader?.split(' ')[1]; // Bearer token formatında bekliyoruz
  return apiKey === process.env.CRON_API_KEY;
};

export async function GET(req: Request) {
  // API key kontrolü yap
  if (!isValidApiKey(req)) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Unauthorized',
        message: 'Geçersiz veya eksik API anahtarı'
      },
      { status: 401 }
    );
  }

  try {
    // Mevcut sistem durumunu kontrol et
    const systemStatus = await getSystemStatus();
    if (!systemStatus.apiHealthy) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Service Unavailable',
          message: 'API şu anda çalışmıyor'
        },
        { status: 503 }
      );
    }

    // Haberleri çek
    const startTime = Date.now();
    const result = await fetchNewsIncremental();
    const duration = Date.now() - startTime;

    // Prepare response data
    const responseData: FetchNewsResponse = {
      success: result.success,
      message: result.success ? 'Haberler başarıyla çekildi' : 'Haber çekilirken hata oluştu',
      totalProcessed: result.totalProcessed,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      duration,
    };

    // Add error details if any
    if (result.errors > 0) {
      responseData.error = `${result.errors} hata oluştu`;
      console.error('Errors during news fetch:', result.errorDetails);
    }

    // Log results
    console.log('Cron job completed', responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('Cron job failed:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: 'Haberler çekilirken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

// Harici cron servisleri için POST isteğini de destekle
export { GET as POST };
