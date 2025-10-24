#!/usr/bin/env tsx

/**
 * News Fetch CLI Tool
 *
 * Kullanım:
 * npm run news:fetch -- --help
 * npm run news:fetch -- --limit 100 --batch 25
 */

import 'dotenv/config'; // Load environment variables
import { fetchNewsIncremental, fetchNewsBatch, getSystemStatus } from '../lib/news/index';
import { logger, PerformanceMonitor } from '../lib/news/error-handler';

interface CLIOptions {
  limit?: number;
  offset?: number;
  batch?: number;
  force?: boolean;
  status?: boolean;
  help?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--limit':
      case '-l':
        options.limit = nextArg ? parseInt(nextArg) : 50;
        i++;
        break;
      case '--offset':
      case '-o':
        options.offset = nextArg ? parseInt(nextArg) : 0;
        i++;
        break;
      case '--batch':
      case '-b':
        options.batch = nextArg ? parseInt(nextArg) : 50;
        i++;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--status':
      case '-s':
        options.status = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
News Fetch CLI Tool

Usage: npm run news:fetch [options]

Options:
  -l, --limit <number>    Number of items to fetch (default: 50)
  -o, --offset <number>   Offset for pagination (default: 0)
  -b, --batch <number>    Batch size for batch processing (default: 50)
  -f, --force             Force fetch (ignore duplicates)
  -s, --status            Show system status only
  -h, --help              Show this help message

Examples:
  npm run news:fetch                    # Fetch 50 items incrementally
  npm run news:fetch -l 100            # Fetch 100 items
  npm run news:fetch -l 200 -b 25      # Fetch 200 items in batches of 25
  npm run news:fetch -f -l 50          # Force fetch 50 items
  npm run news:fetch -s                # Show system status
  `);
}

async function showStatus() {
  console.log('📊 System Status:');
  const status = await getSystemStatus();

  console.log(`API Healthy: ${status.apiHealthy ? '✅' : '❌'}`);
  console.log(`Database Connected: ${status.databaseConnected ? '✅' : '❌'}`);
  console.log(`Total News: ${status.totalNews}`);

  if (status.lastImport) {
    console.log(`Last Import: ${status.lastImport.toISOString()}`);
  } else {
    console.log('Last Import: Never');
  }

  const metrics = PerformanceMonitor.getMetrics();
  if (Object.keys(metrics).length > 0) {
    console.log('\n📈 Performance Metrics:');
    Object.entries(metrics).forEach(([operation, metric]) => {
      console.log(`  ${operation}: ${metric.count} ops, ${Math.round(metric.averageTime)}ms avg`);
    });
  }
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  if (options.status) {
    await showStatus();
    return;
  }

  const { limit = 50, offset = 0, batch, force = false } = options;

  console.log('🚀 Starting News Fetch');
  console.log(`📊 Options: limit=${limit}, offset=${offset}, force=${force}, batch=${batch}`);

  try {
    let result;

    if (batch && limit > batch) {
      console.log(`📦 Using batch processing: ${Math.ceil(limit / batch)} batches of ${batch}`);
      const results = await fetchNewsBatch(limit, batch);

      const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      console.log('\n📊 Batch Results:');
      console.log(`✅ Total Imported: ${totalImported}`);
      console.log(`⏭️ Total Skipped: ${totalSkipped}`);
      console.log(`❌ Total Errors: ${totalErrors}`);
      console.log(`📦 Batches Processed: ${results.length}`);

    } else {
      console.log('🔄 Using incremental fetch');
      result = await fetchNewsIncremental({ limit, offset, force });

      console.log('\n📊 Results:');
      console.log(`📈 Total Processed: ${result.totalProcessed}`);
      console.log(`✅ Imported: ${result.imported}`);
      console.log(`⏭️ Skipped: ${result.skipped}`);
      console.log(`❌ Errors: ${result.errors}`);
      console.log(`⏱️ Duration: ${result.duration}ms`);

      if (result.errors > 0) {
        console.log('\n❌ Error Details:');
        result.errorDetails.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.error} (${error.code})`);
        });
      }
    }

    // Final status
    console.log('\n📊 Final Status:');
    await showStatus();

  } catch (error) {
    console.error('💥 CLI Error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
