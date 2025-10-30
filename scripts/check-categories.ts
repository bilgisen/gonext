import { db } from '../db/client';
import { categories } from '../db/schema';

async function checkCategories() {
  try {
    console.log('📋 Fetching categories from database...');
    const allCategories = await db.select().from(categories);
    
    if (allCategories.length === 0) {
      console.log('ℹ️ No categories found in the database.');
      return;
    }

    console.log('\n📊 Categories in database:');
    console.table(allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      is_active: cat.is_active,
      created_at: cat.created_at?.toISOString().split('T')[0]
    })));

    // Check for any slugs with uppercase letters
    const invalidSlugs = allCategories.filter(cat => cat.slug !== cat.slug.toLowerCase());
    
    if (invalidSlugs.length > 0) {
      console.log('\n⚠️ Warning: Found categories with uppercase letters in slugs:');
      console.table(invalidSlugs.map(cat => ({
        id: cat.id,
        current_slug: cat.slug,
        suggested_slug: cat.slug.toLowerCase()
      })));
    } else {
      console.log('\n✅ All category slugs are in lowercase.');
    }

  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    process.exit(0);
  }
}

checkCategories();
