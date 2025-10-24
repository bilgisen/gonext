#!/usr/bin/env tsx

/**
 * News Fetch System - Test Script
 *
 * Kullanım:
 * npm run tsx scripts/test-news-fetch.ts
 * or
 * npx tsx scripts/test-news-fetch.ts
 */

import 'dotenv/config'; // Load environment variables
import { fetchNewsIncremental, fetchNewsBatch, getSystemStatus } from '../lib/news/index';
import { logger, PerformanceMonitor } from '../lib/news/error-handler';

async function main() {
  console.log('🚀 News Fetch System Test Started\n');

  try {
    // System status check
    console.log('📊 Checking system status...');
    const status = await getSystemStatus();
    console.log('✅ API Healthy:', status.apiHealthy);
    console.log('✅ Database Connected:', status.databaseConnected);
    console.log('✅ Total News:', status.totalNews);
    if (status.lastImport) {
      console.log('✅ Last Import:', status.lastImport.toISOString());
    }
    console.log('');

    // Test incremental fetch
    console.log('🔄 Testing incremental fetch (50 items)...');
    const endTimer = PerformanceMonitor.startTimer('incremental_fetch');

    const result = await fetchNewsIncremental({
      limit: 50,
      offset: 0
    });

    endTimer();

    console.log('📈 Results:');
    console.log(`   Total Processed: ${result.totalProcessed}`);
    console.log(`   Imported: ${result.imported}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log('');

    if (result.errors > 0) {
      console.log('❌ Errors encountered:');
      result.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.error} (${error.code})`);
      });
      console.log('');
    }

    // Test batch processing
    console.log('🔄 Testing batch processing (100 items in batches of 25)...');
    const batchEndTimer = PerformanceMonitor.startTimer('batch_fetch');

    const batchResults = await fetchNewsBatch(100, 25);

    batchEndTimer();

    console.log('📊 Batch Results:');
    const totalImported = batchResults.reduce((sum, r) => sum + r.imported, 0);
    const totalSkipped = batchResults.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = batchResults.reduce((sum, r) => sum + r.errors, 0);

    console.log(`   Total Imported: ${totalImported}`);
    console.log(`   Total Skipped: ${totalSkipped}`);
    console.log(`   Total Errors: ${totalErrors}`);
    console.log(`   Batches: ${batchResults.length}`);
    console.log('');

    // Performance metrics
    console.log('⏱️ Performance Metrics:');
    const metrics = PerformanceMonitor.getMetrics();
    Object.entries(metrics).forEach(([operation, metric]) => {
      console.log(`   ${operation}:`);
      console.log(`     Count: ${metric.count}`);
      console.log(`     Average Time: ${Math.round(metric.averageTime)}ms`);
      console.log(`     Error Rate: ${Math.round(metric.errorRate * 100)}%`);
    });
    console.log('');

    // Final system status
    console.log('📊 Final System Status:');
    const finalStatus = await getSystemStatus();
    console.log(`   Total News: ${finalStatus.totalNews}`);
    console.log(`   Last Import: ${finalStatus.lastImport?.toISOString() || 'Never'}`);
    console.log('');

    // Error logs
    const errorLogs = logger.getLogsByCategory('ERROR_HANDLER');
    if (errorLogs.length > 0) {
      console.log('⚠️ Error Logs:');
      errorLogs.slice(-5).forEach(log => {
        console.log(`   [${log.timestamp.toISOString()}] ${log.message}`);
      });
      console.log('');
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run the test
main().catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
