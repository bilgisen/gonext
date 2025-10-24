#!/usr/bin/env tsx

/**
 * Database Test Script - Check tables and data
 */

import 'dotenv/config';
import { db } from '../db/client';
import { news, categories, tags, sources, media } from '../db/schema';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  console.log('🔍 Checking database tables and data...\n');

  try {
    // Check tables exist
    console.log('📊 Checking tables...\n');

    // News table
    try {
      const newsCount = await db.select({ count: sql<number>`count(*)` }).from(news);
      console.log(`✅ News table: ${newsCount[0].count} records`);

      if (newsCount[0].count > 0) {
        const recentNews = await db.select().from(news).limit(3);
        console.log('📝 Recent news:');
        recentNews.forEach(n => {
          console.log(`   - ${n.title} (${n.status})`);
        });
      }
    } catch (error) {
      console.log(`❌ News table: Error - ${error.message}`);
    }

    // Categories table
    try {
      const categoriesCount = await db.select({ count: sql<number>`count(*)` }).from(categories);
      console.log(`✅ Categories table: ${categoriesCount[0].count} records`);

      if (categoriesCount[0].count > 0) {
        const cats = await db.select().from(categories).limit(5);
        console.log('🏷️ Categories:');
        cats.forEach(c => {
          console.log(`   - ${c.name} (${c.slug})`);
        });
      }
    } catch (error) {
      console.log(`❌ Categories table: Error - ${error.message}`);
    }

    // Tags table
    try {
      const tagsCount = await db.select({ count: sql<number>`count(*)` }).from(tags);
      console.log(`✅ Tags table: ${tagsCount[0].count} records`);

      if (tagsCount[0].count > 0) {
        const tagList = await db.select().from(tags).limit(5);
        console.log('🏷️ Tags:');
        tagList.forEach(t => {
          console.log(`   - ${t.name} (${t.slug})`);
        });
      }
    } catch (error) {
      console.log(`❌ Tags table: Error - ${error.message}`);
    }

    // Sources table
    try {
      const sourcesCount = await db.select({ count: sql<number>`count(*)` }).from(sources);
      console.log(`✅ Sources table: ${sourcesCount[0].count} records`);

      if (sourcesCount[0].count > 0) {
        const sourceList = await db.select().from(sources).limit(3);
        console.log('🔗 Sources:');
        sourceList.forEach(s => {
          console.log(`   - ${s.name} (${s.base_url})`);
        });
      }
    } catch (error) {
      console.log(`❌ Sources table: Error - ${error.message}`);
    }

    // Media table
    try {
      const mediaCount = await db.select({ count: sql<number>`count(*)` }).from(media);
      console.log(`✅ Media table: ${mediaCount[0].count} records`);
    } catch (error) {
      console.log(`❌ Media table: Error - ${error.message}`);
    }

    // Test fetch from API and insert
    console.log('\n🔄 Testing API fetch and insert...\n');

    try {
      const { fetchNews } = await import('../lib/news/index');
      const result = await fetchNews({ limit: 5, offset: 0 });

      console.log(`📈 Fetch result:`);
      console.log(`   Total processed: ${result.totalProcessed}`);
      console.log(`   Imported: ${result.imported}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Errors: ${result.errors}`);
      console.log(`   Duration: ${result.duration}ms`);

      if (result.errors > 0) {
        console.log('❌ Error details:');
        result.errorDetails.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.error} (${error.code})`);
        });
      }

      // Check updated counts
      const updatedNewsCount = await db.select({ count: sql<number>`count(*)` }).from(news);
      console.log(`\n📊 Updated news count: ${updatedNewsCount[0].count}`);

    } catch (error) {
      console.log(`❌ API fetch test failed: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 Database check failed:', error);
  }
}

checkDatabase().catch(console.error);
