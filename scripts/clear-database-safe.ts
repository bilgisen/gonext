import { db } from '../db/client';
import { sql } from 'drizzle-orm';

// Tables in order of deletion to respect foreign key constraints
const TABLES_IN_ORDER = [
  'news_revisions',
  'news_categories',
  'news_tags',
  'news_tldr',
  'news_media',
  'news',
  'editors',
  'media',
  'categories',
  'tags',
  'sources',
  'import_logs'
];

export async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Disable foreign key checks (if supported)
    try {
      await db.execute(sql`SET session_replication_role = 'replica';`);
      console.log('✓ Disabled foreign key checks');
    } catch (e) {
      console.log('ℹ️ Could not disable foreign key checks (this is okay)');
    }
    
    // Delete data from each table in the correct order
    for (const table of TABLES_IN_ORDER) {
      try {
        console.log(`\n🧹 Clearing table: ${table}...`);
        await db.execute(sql.raw(`DELETE FROM "${table}";`));
        
        // Get row count
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table}";`));
        const count = countResult.rows[0]?.count || 0;
        
        console.log(`✅ Cleared ${count} rows from ${table}`);
      } catch (error: any) {
        console.error(`❌ Error clearing table ${table}:`, error.message);
        console.log('Continuing with next table...');
      }
    }
    
    // Re-enable foreign key checks
    try {
      await db.execute(sql`SET session_replication_role = 'origin';`);
      console.log('✓ Re-enabled foreign key checks');
    } catch (e) {
      // Ignore if we couldn't re-enable
    }
    
    console.log('\n✨ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

// Run the function
clearDatabase();
