import { db } from '../db/client';
import { sql } from 'drizzle-orm';

// Define tables in the correct order to respect foreign key constraints
const TABLES_IN_ORDER = [
  // Child tables first (tables that have foreign keys to other tables)
  'editors',
  'import_logs',
  'news_revisions',
  'news_media',
  'news_tags',
  'news_tldr',
  'news_categories',
  'news',
  'media',
  'tags',
  'categories',
  'sources'
];

export async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Get all tables from the schema to verify they exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    
    const existingTables = result.rows.map((row: any) => row.table_name);
    
    // Filter out tables that don't exist in the database
    const tablesToClear = TABLES_IN_ORDER.filter(table => 
      existingTables.includes(table) && 
      !['spatial_ref_sys', 'geography_columns', 'geometry_columns', '__drizzle_migrations'].includes(table)
    );
    
    console.log('Tables to clear in order:', tablesToClear);
    
    // Delete all data from each table in the specified order
    for (const table of tablesToClear) {
      try {
        console.log(`Deleting all rows from ${table}...`);
        await db.execute(sql.raw(`DELETE FROM "${table}";`));
        console.log(`✅ Cleared ${table}`);
      } catch (error) {
        console.error(`❌ Error clearing table ${table}:`, error);
        // Continue with the next table even if one fails
      }
    }
    
    // Reset sequences for all tables with serial columns
    console.log('Resetting sequences...');
    const sequences = await db.execute(sql`
      SELECT c.relname as sequence_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'S' AND n.nspname = 'public';
    `);
    
    for (const seq of sequences.rows) {
      try {
        await db.execute(sql.raw(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1;`));
        console.log(`✅ Reset sequence ${seq.sequence_name}`);
      } catch (error) {
        console.error(`❌ Error resetting sequence ${seq.sequence_name}:`, error);
      }
    }
    
    console.log('\n✅ Database cleared and reset successfully!');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the function
clearDatabase();
