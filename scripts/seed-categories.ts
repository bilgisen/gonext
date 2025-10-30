import { db } from '../db/client';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define the categories to be inserted
const CATEGORIES = [
  { name: 'Turkey', slug: 'turkey', order: 1 },
  { name: 'Business', slug: 'business', order: 2 },
  { name: 'World', slug: 'world', order: 3 },
  { name: 'Culture', slug: 'culture', order: 4 },
  { name: 'Technology', slug: 'technology', order: 5 },
  { name: 'Travel', slug: 'travel', order: 6 },
  { name: 'Sports', slug: 'sports', order: 7 },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  let successCount = 0;
  
  for (const category of CATEGORIES) {
    try {
      // Check if category already exists
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`✅ Category already exists: ${category.name} (${category.slug})`);
        successCount++;
        continue;
      }
      
      // Insert new category
      await db.insert(categories).values({
        name: category.name,
        slug: category.slug,
        order: category.order,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log(`✅ Added category: ${category.name} (${category.slug})`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error adding category ${category.name}:`, error);
    }
  }
  
  console.log(`\n🎉 Seeding complete. Successfully processed ${successCount} of ${CATEGORIES.length} categories.`);
}

// Run the seed function
seedCategories()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
