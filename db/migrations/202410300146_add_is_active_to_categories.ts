import { sql } from 'drizzle-orm';
import { db } from '../client';

export async function up() {
  console.log('Running migration: add_is_active_to_categories');
  
  // Add is_active column if it doesn't exist
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE categories ADD COLUMN is_active boolean DEFAULT true;
        RAISE NOTICE 'Added is_active column to categories table';
      ELSE
        RAISE NOTICE 'is_active column already exists in categories table';
      END IF;
    END $$;
  `);
  
  console.log('✅ Migration completed: add_is_active_to_categories');
}

export async function down() {
  console.log('Reverting migration: add_is_active_to_categories');
  
  // Remove is_active column if it exists
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE categories DROP COLUMN is_active;
        RAISE NOTICE 'Removed is_active column from categories table';
      ELSE
        RAISE NOTICE 'is_active column does not exist in categories table';
      END IF;
    END $$;
  `);
  
  console.log('✅ Migration reverted: add_is_active_to_categories');
}
