import { db } from '../db/client';
import { sql } from 'drizzle-orm';

const DEFAULT_CATEGORIES = [
  { name: 'Türkiye', slug: 'turkiye' },
  { name: 'Business', slug: 'business' },
  { name: 'World', slug: 'world' },
  { name: 'Culture', slug: 'culture' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Travel', slug: 'travel' },
  { name: 'Sports', slug: 'sports' }
] as const;

async function initializeCategories() {
  console.log('Starting database initialization...');
  
  try {
    // Check if categories table is empty
    const existingCategories = await db.execute(sql`SELECT id FROM categories LIMIT 1`);
    
    if (existingCategories.rows.length > 0) {
      console.log('Categories already exist in the database. Skipping initialization.');
      return;
    }

    console.log('Adding default categories to the database...');
    
    // Insert all default categories using raw SQL
    for (const category of DEFAULT_CATEGORIES) {
      try {
        await db.execute(sql`
          INSERT INTO categories (name, slug, created_at)
          VALUES (${category.name}, ${category.slug}, NOW())
          ON CONFLICT (slug) DO NOTHING
        `);
        console.log(`✅ Added category: ${category.name} (${category.slug})`);
      } catch (error) {
        console.error(`❌ Error adding category ${category.name}:`, error);
      }
    }
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the initialization
initializeCategories();
