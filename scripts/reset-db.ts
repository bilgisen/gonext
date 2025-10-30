import { db } from '../db/client';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  console.log('🚀 Starting database reset...');
  
  try {
    // Disable foreign key checks if supported
    await db.execute(sql`SET session_replication_role = 'replica';`);
    console.log('✓ Disabled foreign key checks');
  } catch (e) {
    console.log('ℹ️ Could not disable foreign key checks (this is okay)');
  }
  
  try {
    // Get all tables in the database
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'spatial_ref_sys'
      AND table_name != 'geography_columns' 
      AND table_name != 'geometry_columns'
      AND table_name != '__drizzle_migrations';
    `);
    
    const tables = tablesResult.rows.map((row: any) => row.table_name);
    
    // Drop all tables
    for (const table of tables) {
      try {
        console.log(`🗑️  Dropping table: ${table}...`);
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
        console.log(`✓ Dropped table: ${table}`);
      } catch (error: any) {
        console.error(`❌ Error dropping table ${table}:`, error.message);
      }
    }
    
    console.log('\n✅ Database reset complete!');
    console.log('\nPlease restart your application to recreate the database schema.');
    
  } catch (error: any) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  } finally {
    try {
      // Re-enable foreign key checks if they were disabled
      await db.execute(sql`SET session_replication_role = 'origin';`);
      console.log('\n✓ Re-enabled foreign key checks');
    } catch (e) {
      console.log('ℹ️ Could not re-enable foreign key checks (this is okay)');
    }
    
    // Exit successfully
    process.exit(0);
  }
}

// Run the reset function
resetDatabase();
