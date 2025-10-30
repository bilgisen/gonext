#!/usr/bin/env tsx

/**
 * Update News Tags Script
 * 
 * This script updates tags for all news items in the database
 * by fetching the latest data from the API and updating the tags.
 * 
 * Usage: npx tsx scripts/update-news-tags.ts
 */

import 'dotenv/config';
import { db } from '../db/client';
import { news } from '../db/schema';
import { fetchNewsFromApi } from '../lib/news/api-client';
import { updateNewsTags } from '../lib/news/tags-utils';
// Remove unused PerformanceMonitor import

// Configuration
const BATCH_SIZE = 50;

import type { NewsItem } from '../types/news';

// Interface for database news item
interface DatabaseNewsItem {
  id: number;
  source_guid: string;
  canonical_url: string | null;
  title: string;
  [key: string]: unknown;
}

async function processNewsItem(newsItem: DatabaseNewsItem) {
  try {
    // Skip if no canonical URL is available
    if (!newsItem.canonical_url) {
      return { id: newsItem.id, success: false, reason: 'No canonical URL' };
    }

    // Get the latest version of the news from the API
    const apiResponse = await fetchNewsFromApi(1, 0);
    const latestNews = apiResponse.items.find(item => 
      (item.source_guid && item.source_guid === newsItem.source_guid) ||
      (item.original_url && item.original_url === newsItem.canonical_url)
    ) as NewsItem | undefined;

    if (latestNews && Array.isArray(latestNews.tags) && latestNews.tags.length > 0) {
      console.log(`Updating tags for: ${newsItem.title}`);
      await updateNewsTags(newsItem.id, latestNews.tags);
      return { id: newsItem.id, success: true };
    }
    
    return { id: newsItem.id, success: false, reason: 'No tags found or news not in API' };
  } catch (error) {
    console.error(`Error processing news item ${newsItem.id}:`, error);
    return { id: newsItem.id, success: false, error };
  }
}

async function updateAllNewsTags() {
  const startTime = Date.now();
  console.log('🚀 Starting news tags update process...');
  
  try {
    // Get all news items that need tag updates
    const allNews = await db
      .select()
      .from(news)
      .orderBy(news.published_at);
    
    console.log(`📋 Found ${allNews.length} news items to process`);
    
    // Process in batches to avoid overwhelming the database/API
    const results = [];
    const totalBatches = Math.ceil(allNews.length / BATCH_SIZE);
    
    for (let i = 0; i < allNews.length; i += BATCH_SIZE) {
      const batch = allNews.slice(i, i + BATCH_SIZE);
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`🔄 Processing batch ${currentBatch} of ${totalBatches}`);
      
      // Process batch
      const batchResults = await Promise.all(
        batch.map(newsItem => processNewsItem(newsItem))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (currentBatch < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Generate summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Update complete!');
    console.log(`📊 Successfully updated: ${successCount} news items`);
    console.log(`❌ Failed to update: ${failedCount} news items`);
    console.log(`⏱️  Total time: ${elapsedTime}s`);
    
    if (failedCount > 0) {
      const failedItems = results.filter(r => !r.success);
      console.log('\nFailed items:', failedItems);
    }
    
  } catch (error) {
    console.error('❌ Error in update process:', error);
    process.exit(1);
  }
}

// Run the script
updateAllNewsTags().catch(console.error);
