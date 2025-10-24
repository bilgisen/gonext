import { NewsApiResponse } from './types';
import fs from 'fs';
import path from 'path';

/**
 * Test için local JSON'dan haberleri okur
 */
export async function fetchNewsFromTest(): Promise<NewsApiResponse> {
  try {
    const testFilePath = path.join(process.cwd(), 'app/test/news.json');
    const fileContent = fs.readFileSync(testFilePath, 'utf8');
    const data = JSON.parse(fileContent) as NewsApiResponse;

    console.log(`✅ Test data loaded: ${data.items.length} items`);

    return data;
  } catch (error) {
    console.error('❌ Test data load failed:', error);
    return { items: [], page: 1, page_size: 20, total: 0 };
  }
}
