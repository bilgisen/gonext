import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { news } from '../db/schema';

export async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Get all tables from the schema
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    
    const tables = result.rows
      .map((row: any) => row.table_name)
      .filter((table: string) => 
        !['spatial_ref_sys', 'geography_columns', 'geometry_columns', '__drizzle_migrations'].includes(table)
      );
    
    console.log('Found tables to clear:', tables);
    
    // Delete all data from each table using DELETE instead of TRUNCATE
    for (const table of tables) {
      try {
        console.log(`Deleting all rows from ${table}...`);
        await db.execute(sql.raw(`DELETE FROM "${table}";`));
        console.log(`✅ Cleared ${table}`);
      } catch (error) {
        console.error(`❌ Error clearing table ${table}:`, error);
      }
    }
    
    console.log('\n✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

// Run the function
clearDatabase();
