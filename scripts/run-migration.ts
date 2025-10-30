import { db } from '../db/client';
import { up as addIsActiveToCategories } from '../db/migrations/202410300146_add_is_active_to_categories';

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Run migrations in order
    await addIsActiveToCategories();
    
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
