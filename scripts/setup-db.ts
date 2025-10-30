import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { categories } from '../db/schema';

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Create tables using the schema
    console.log('🔄 Creating database tables...');
    
    // Create tables one by one to avoid the multiple commands error
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "sources" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "base_url" text NOT NULL,
        "meta" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp
      )`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "media" (
        "id" SERIAL PRIMARY KEY,
        "original_name" varchar(1024),
        "external_url" text,
        "storage_path" text,
        "mime_type" varchar(127),
        "width" integer,
        "height" integer,
        "alt_text" varchar(1024),
        "caption" text,
        "hash" varchar(128),
        "filesize" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp
      )`);
    
    // Create categories table first without the self-reference
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) UNIQUE NOT NULL,
        "description" text,
        "parent_id" integer,
        "order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "seo_title" varchar(255),
        "seo_description" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp
      )`);
    
    // Now add the self-referential foreign key
    try {
      await db.execute(sql`
        ALTER TABLE "categories" 
        ADD CONSTRAINT fk_categories_parent 
        FOREIGN KEY ("parent_id") 
        REFERENCES "categories"("id") 
        ON DELETE SET NULL`);
    } catch (error) {
      console.log('ℹ️ Foreign key constraint already exists or could not be added');
    }
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "editors" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "email" varchar(320) NOT NULL UNIQUE,
        "bio" text,
        "avatar_media_id" integer,
        "role" varchar(64) DEFAULT 'editor',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp,
        CONSTRAINT fk_editors_media FOREIGN KEY ("avatar_media_id") REFERENCES "media"("id") ON DELETE SET NULL
      )`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "description" text,
        "image_media_id" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp,
        CONSTRAINT fk_tags_media FOREIGN KEY ("image_media_id") REFERENCES "media"("id") ON DELETE SET NULL
      )`);
    
    // Create news table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news" (
        "id" SERIAL PRIMARY KEY,
        "source_guid" varchar(255) NOT NULL UNIQUE,
        "source_id" text,
        "source_fk" integer,
        "title" text NOT NULL,
        "seo_title" varchar(512),
        "seo_description" text,
        "excerpt" text,
        "tldr_count" integer DEFAULT 0,
        "content_md" text,
        "content_html" text,
        "main_media_id" integer,
        "slug" varchar(512) NOT NULL,
        "canonical_url" text,
        "status" varchar(32) DEFAULT 'draft',
        "visibility" varchar(32) DEFAULT 'public',
        "editor_id" integer,
        "word_count" integer,
        "reading_time_min" integer,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp,
        "meta" jsonb,
        CONSTRAINT fk_news_source FOREIGN KEY ("source_fk") REFERENCES "sources"("id") ON DELETE SET NULL,
        CONSTRAINT fk_news_media FOREIGN KEY ("main_media_id") REFERENCES "media"("id") ON DELETE SET NULL,
        CONSTRAINT fk_news_editor FOREIGN KEY ("editor_id") REFERENCES "editors"("id") ON DELETE SET NULL
      )`);
    
    // Create news_tldr table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news_tldr" (
        "id" SERIAL PRIMARY KEY,
        "news_id" integer NOT NULL,
        "position" integer NOT NULL,
        "text" text NOT NULL,
        CONSTRAINT fk_tldr_news FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE
      )`);
    
    // Create news_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news_categories" (
        "id" SERIAL PRIMARY KEY,
        "news_id" integer NOT NULL,
        "category_id" integer NOT NULL,
        CONSTRAINT fk_nc_news FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE,
        CONSTRAINT fk_nc_category FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT uq_news_category UNIQUE ("news_id", "category_id")
      )`);
    
    // Create news_tags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news_tags" (
        "id" SERIAL PRIMARY KEY,
        "news_id" integer NOT NULL,
        "tag_id" integer NOT NULL,
        CONSTRAINT fk_nt_news FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE,
        CONSTRAINT fk_nt_tag FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT uq_news_tag UNIQUE ("news_id", "tag_id")
      )`);
    
    // Create news_media table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news_media" (
        "id" SERIAL PRIMARY KEY,
        "news_id" integer NOT NULL,
        "media_id" integer NOT NULL,
        "position" integer DEFAULT 0,
        "caption" text,
        "is_main" boolean DEFAULT false,
        CONSTRAINT fk_nm_news FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE,
        CONSTRAINT fk_nm_media FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE
      )`);
    
    // Create news_revisions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news_revisions" (
        "id" SERIAL PRIMARY KEY,
        "news_id" integer NOT NULL,
        "editor_id" integer,
        "content_md" text,
        "content_html" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "note" text,
        CONSTRAINT fk_rev_news FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE,
        CONSTRAINT fk_rev_editor FOREIGN KEY ("editor_id") REFERENCES "editors"("id") ON DELETE SET NULL
      )`);
    
    // Create import_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "import_logs" (
        "id" SERIAL PRIMARY KEY,
        "source_id" integer,
        "external_file" text,
        "imported_at" timestamp DEFAULT now() NOT NULL,
        "imported_count" integer,
        "meta" jsonb,
        CONSTRAINT fk_import_source FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL
      )`);
    
    console.log('✅ Database tables created');
    
    // Now seed the categories
    await seedCategories();
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  const CATEGORIES = [
    { name: 'Turkey', slug: 'turkey', order: 1 },
    { name: 'Business', slug: 'business', order: 2 },
    { name: 'World', slug: 'world', order: 3 },
    { name: 'Culture', slug: 'culture', order: 4 },
    { name: 'Technology', slug: 'technology', order: 5 },
    { name: 'Travel', slug: 'travel', order: 6 },
    { name: 'Sports', slug: 'sports', order: 7 },
  ];
  
  let successCount = 0;
  
  for (const category of CATEGORIES) {
    try {
      // Check if category already exists
      const existing = await db
        .select()
        .from(categories)
        .where(sql`${categories.slug} = ${category.slug}`)
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
  return successCount === CATEGORIES.length;
}

// Run the setup
setupDatabase();
