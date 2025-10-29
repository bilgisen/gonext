// db/schema.ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  json,
  // if your drizzle version exposes 'json' or 'jsonb' adjust accordingly
} from "drizzle-orm/pg-core";

/**
 * sources: Haberleri sağlayan dış kaynaklar
 */
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  base_url: text("base_url").notNull(),
  // optional metadata (api keys, notes)
  meta: json("meta"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

/**
 * media: tüm görseller/dosyalar burada tutulur.
 * - external_url: API'den gelen external url
 * - storage_path: bizim yerel/remote storage'da tuttuğumuz yol/isim
 * - hash: dosya içeriği hash'i (duplication kontrolü)
 */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  original_name: varchar("original_name", { length: 1024 }),
  external_url: text("external_url"),
  storage_path: text("storage_path"), // örn: /media/2025/10/23/slug.jpg
  mime_type: varchar("mime_type", { length: 127 }),
  width: integer("width"),
  height: integer("height"),
  alt_text: varchar("alt_text", { length: 1024 }),
  caption: text("caption"),
  hash: varchar("hash", { length: 128 }), // optional
  filesize: integer("filesize"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

/**
 * editors: site editörleri (ileride auth bağlanacak)
 */
export const editors = pgTable("editors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  bio: text("bio"),
  avatar_media_id: integer("avatar_media_id").references(() => media.id),
  role: varchar("role", { length: 64 }).default("editor"), // admin, editor, chief, etc
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

/**
 * categories: hiyerarşik kategoriler
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  parent_id: integer("parent_id").references((): any => categories.id), // self ref with type assertion
  order: integer("order").default(0),
  is_active: boolean("is_active").default(true),
  seo_title: varchar("seo_title", { length: 255 }),
  seo_description: text("seo_description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

/**
 * tags: etiketler (kendi sayfaları olabilir)
 */
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image_media_id: integer("image_media_id").references(() => media.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

/**
 * news: ana haber (article) tablosu
 *
 * - source_guid: dış API tarafından üretilen hash (duplication kontrolü)
 * - source_id: dış API id (text, çünkü büyük numeric string olabilir)
 * - status: draft/published/archived vb
 * - content_md: orijinal markdown
 * - content_html: render edilmiş html (cache, opsiyonel)
 * - canonical_url: bizim oluşturduğumuz SEO URL (slug + path) veya orijinal
 * - main_media_id: haberin ana resmi (opsiyonel)
 */
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  source_guid: varchar("source_guid", { length: 255 }).notNull().unique(),
  source_id: text("source_id"), // API'deki id (string)
  source_fk: integer("source_fk").references(() => sources.id),
  title: text("title").notNull(),
  seo_title: varchar("seo_title", { length: 512 }),
  seo_description: text("seo_description"),
  excerpt: text("excerpt"), // kısa özet
  tldr_count: integer("tldr_count").default(0), // hızlı referans
  content_md: text("content_md"), // markdown payload
  content_html: text("content_html"), // önbelleklenmiş html
  main_media_id: integer("main_media_id").references(() => media.id),
  slug: varchar("slug", { length: 512 }).notNull(), // seo url part
  canonical_url: text("canonical_url"),
  status: varchar("status", { length: 32 }).default("draft"), // draft/published/archived
  visibility: varchar("visibility", { length: 32 }).default("public"), // public/private
  editor_id: integer("editor_id").references(() => editors.id),
  word_count: integer("word_count"),
  reading_time_min: integer("reading_time_min"),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
  // indexing / misc JSON metadata
  meta: json("meta"),
});

/**
 * news_tldr: TL;DR satırları (pozisyona göre sıralanır)
 */
export const news_tldr = pgTable("news_tldr", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id").references(() => news.id).notNull(),
  position: integer("position").notNull(), // 1..n
  text: text("text").notNull(),
});

/**
 * news_categories: çoklu kategori ilişkisi
 */
export const news_categories = pgTable("news_categories", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id").references(() => news.id).notNull(),
  category_id: integer("category_id").references(() => categories.id).notNull(),
});

/**
 * news_tags: çoklu tag ilişkisi
 */
export const news_tags = pgTable("news_tags", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id").references(() => news.id).notNull(),
  tag_id: integer("tag_id").references(() => tags.id).notNull(),
});

/**
 * news_media: haber <-> media (galeri vb)
 */
export const news_media = pgTable("news_media", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id").references(() => news.id).notNull(),
  media_id: integer("media_id").references(() => media.id).notNull(),
  position: integer("position").default(0),
  caption: text("caption"),
  is_main: boolean("is_main").default(false),
});

/**
 * Optional: article revisions (ileride editor workflow'unu destekler)
 */
export const news_revisions = pgTable("news_revisions", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id").references(() => news.id).notNull(),
  editor_id: integer("editor_id").references(() => editors.id),
  content_md: text("content_md"),
  content_html: text("content_html"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  note: text("note"),
});

/**
 * Optional: small sources log table for import history
 */
export const import_logs = pgTable("import_logs", {
  id: serial("id").primaryKey(),
  source_id: integer("source_id").references(() => sources.id),
  external_file: text("external_file"),
  imported_at: timestamp("imported_at").defaultNow().notNull(),
  imported_count: integer("imported_count"),
  meta: json("meta"),
});
