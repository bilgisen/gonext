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
  index,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// AUTH TABLES (Better-Auth)
// ============================================================================

/**
 * user: Kullanıcılar
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * session: Kullanıcı oturumları
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
  user_idx: index("session_user_id_idx").on(table.userId),
  token_idx: uniqueIndex("session_token_idx").on(table.token),
}));

/**
 * account: OAuth ve credential hesapları
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (table) => ({
  user_idx: index("account_user_id_idx").on(table.userId),
  provider_idx: index("account_provider_idx").on(table.providerId, table.accountId),
}));

// Subscription table for Polar webhook data
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  modifiedAt: timestamp("modifiedAt"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  recurringInterval: text("recurringInterval").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  canceledAt: timestamp("canceledAt"),
  startedAt: timestamp("startedAt").notNull(),
  endsAt: timestamp("endsAt"),
  endedAt: timestamp("endedAt"),
  customerId: text("customerId").notNull(),
  productId: text("productId").notNull(),
  discountId: text("discountId"),
  checkoutId: text("checkoutId").notNull(),
  customerCancellationReason: text("customerCancellationReason"),
  customerCancellationComment: text("customerCancellationComment"),
  metadata: text("metadata"), // JSON string
  customFieldData: text("customFieldData"), // JSON string
  userId: text("userId").references(() => user.id),
});

/**
 * verification: Email doğrulama ve şifre sıfırlama
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  identifier_idx: index("verification_identifier_idx").on(table.identifier),
}));

// ============================================================================
// MEDIA & CONTENT TABLES
// ============================================================================

/**
 * sources: Haberleri sağlayan dış kaynaklar
 */
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  base_url: text("base_url").notNull(),
  meta: json("meta"), // API keys, notes, etc.
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
}, (table) => ({
  name_idx: index("sources_name_idx").on(table.name),
}));

/**
 * media: Tüm görseller/dosyalar burada tutulur
 * - external_url: API'den gelen external url
 * - storage_path: Bizim yerel/remote storage'da tuttuğumuz yol/isim
 * - hash: Dosya içeriği hash'i (duplication kontrolü)
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
  hash: varchar("hash", { length: 128 }),
  filesize: integer("filesize"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
}, (table) => ({
  hash_idx: index("media_hash_idx").on(table.hash),
  storage_path_idx: index("media_storage_path_idx").on(table.storage_path),
}));

/**
 * editors: Site editörleri (ileride auth bağlanacak)
 */
export const editors = pgTable("editors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  bio: text("bio"),
  avatar_media_id: integer("avatar_media_id").references(() => media.id),
  role: varchar("role", { length: 64 }).default("editor"), // admin, editor, chief, etc.
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
}, (table) => ({
  email_idx: uniqueIndex("editors_email_idx").on(table.email),
  role_idx: index("editors_role_idx").on(table.role),
}));

/**
 * categories: Hiyerarşik kategoriler
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  parent_id: integer("parent_id").references((): any => categories.id), // self reference
  order: integer("order").default(0),
  is_active: boolean("is_active").default(true),
  seo_title: varchar("seo_title", { length: 255 }),
  seo_description: text("seo_description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
}, (table) => ({
  slug_idx: uniqueIndex("categories_slug_idx").on(table.slug),
  parent_idx: index("categories_parent_id_idx").on(table.parent_id),
  active_order_idx: index("categories_active_order_idx").on(table.is_active, table.order),
}));

/**
 * tags: Etiketler (kendi sayfaları olabilir)
 */
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image_media_id: integer("image_media_id").references(() => media.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
}, (table) => ({
  slug_idx: uniqueIndex("tags_slug_idx").on(table.slug),
  name_idx: index("tags_name_idx").on(table.name),
}));

// ============================================================================
// NEWS TABLES
// ============================================================================

/**
 * news: Ana haber (article) tablosu
 * - source_guid: Dış API tarafından üretilen hash (duplication kontrolü)
 * - source_id: Dış API id (text, çünkü büyük numeric string olabilir)
 * - status: draft/published/archived vb.
 * - content_md: Orijinal markdown
 * - content_html: Render edilmiş html (cache, opsiyonel)
 * - canonical_url: Bizim oluşturduğumuz SEO URL (slug + path) veya orijinal
 * - main_media_id: Haberin ana resmi (opsiyonel)
 */
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  source_guid: varchar("source_guid", { length: 255 }).notNull(),
  source_id: text("source_id"), // API'deki id (string)
  source_fk: integer("source_fk").references(() => sources.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  title: text("title").notNull(),
  seo_title: varchar("seo_title", { length: 512 }),
  seo_description: text("seo_description"),
  excerpt: text("excerpt"), // Kısa özet
  content_md: text("content_md"), // Markdown payload
  content_html: text("content_html"), // Önbelleklenmiş html
  main_media_id: integer("main_media_id").references(() => media.id),
  slug: varchar("slug", { length: 512 }).notNull(),
  canonical_url: text("canonical_url"),
  status: varchar("status", { length: 32 }).default("draft"), // draft/published/archived
  visibility: varchar("visibility", { length: 32 }).default("public"), // public/private
  editor_id: integer("editor_id").references(() => editors.id),
  word_count: integer("word_count"),
  reading_time_min: integer("reading_time_min"),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
  meta: json("meta"), // Indexing / misc metadata
}, (table) => ({
  slug_idx: uniqueIndex("news_slug_idx").on(table.slug),
  source_guid_idx: uniqueIndex("news_source_guid_idx").on(table.source_guid),
  status_idx: index("news_status_idx").on(table.status),
  published_idx: index("news_published_at_idx").on(table.published_at),
  status_published_idx: index("news_status_published_idx").on(table.status, table.published_at),
  source_idx: index("news_source_fk_idx").on(table.source_fk),
  editor_idx: index("news_editor_id_idx").on(table.editor_id),
  visibility_idx: index("news_visibility_idx").on(table.visibility),
}));

/**
 * news_categories: Çoklu kategori ilişkisi
 */
export const news_categories = pgTable("news_categories", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  category_id: integer("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  news_idx: index("news_categories_news_id_idx").on(table.news_id),
  category_idx: index("news_categories_category_id_idx").on(table.category_id),
  unique_news_category: unique("news_categories_unique").on(table.news_id, table.category_id),
}));

/**
 * news_tags: Çoklu tag ilişkisi
 */
export const news_tags = pgTable("news_tags", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  tag_id: integer("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  news_idx: index("news_tags_news_id_idx").on(table.news_id),
  tag_idx: index("news_tags_tag_id_idx").on(table.tag_id),
  unique_news_tag: unique("news_tags_unique").on(table.news_id, table.tag_id),
}));

/**
 * news_media: Haber <-> media (galeri vb.)
 */
export const news_media = pgTable("news_media", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  media_id: integer("media_id")
    .references(() => media.id, { onDelete: "cascade" })
    .notNull(),
  position: integer("position").default(0),
  caption: text("caption"),
  is_main: boolean("is_main").default(false),
}, (table) => ({
  news_idx: index("news_media_news_id_idx").on(table.news_id),
  media_idx: index("news_media_media_id_idx").on(table.media_id),
  position_idx: index("news_media_position_idx").on(table.news_id, table.position),
  unique_news_media: unique("news_media_unique").on(table.news_id, table.media_id),
}));

/**
 * news_revisions: Article revisions (ileride editor workflow'unu destekler)
 */
export const news_revisions = pgTable("news_revisions", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  editor_id: integer("editor_id").references(() => editors.id),
  content_md: text("content_md"),
  content_html: text("content_html"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  note: text("note"),
}, (table) => ({
  news_idx: index("news_revisions_news_id_idx").on(table.news_id),
  editor_idx: index("news_revisions_editor_id_idx").on(table.editor_id),
  created_idx: index("news_revisions_created_at_idx").on(table.created_at),
}));

// ============================================================================
// USER INTERACTION TABLES
// ============================================================================

/**
 * news_views: Haber görüntülenme istatistikleri
 * - session_id: Browser session ID (localStorage)
 * - Trending/en çok okunanlar için kullanılır
 */
export const news_views = pgTable("news_views", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  viewed_at: timestamp("viewed_at").defaultNow().notNull(),
  session_id: varchar("session_id", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  news_idx: index("news_views_news_id_idx").on(table.news_id),
  viewed_at_idx: index("news_views_viewed_at_idx").on(table.viewed_at),
  session_news_idx: index("news_views_session_news_idx").on(table.session_id, table.news_id, table.viewed_at),
  news_viewed_composite_idx: index("news_views_composite_idx").on(table.news_id, table.viewed_at),
}));

/**
 * news_reactions: Kullanıcı tepkileri (like/dislike)
 * - Better-auth user_id ile ilişkili
 * - Bir kullanıcı bir habere sadece 1 reaction verebilir (UNIQUE constraint)
 */
export const news_reactions = pgTable("news_reactions", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reaction_type: varchar("reaction_type", { length: 20 }).notNull(), // 'like' or 'dislike'
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  news_idx: index("news_reactions_news_id_idx").on(table.news_id),
  user_idx: index("news_reactions_user_id_idx").on(table.user_id),
  type_idx: index("news_reactions_type_idx").on(table.reaction_type),
  news_type_idx: index("news_reactions_news_type_idx").on(table.news_id, table.reaction_type),
  unique_user_news: unique("news_reactions_unique").on(table.news_id, table.user_id),
}));

/**
 * news_bookmarks: Kullanıcı kayıtları (saved articles)
 * - Better-auth user_id ile ilişkili
 * - Bir kullanıcı aynı haberi birden fazla bookmark edemez (UNIQUE constraint)
 */
export const news_bookmarks = pgTable("news_bookmarks", {
  id: serial("id").primaryKey(),
  news_id: integer("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  news_idx: index("news_bookmarks_news_id_idx").on(table.news_id),
  user_idx: index("news_bookmarks_user_id_idx").on(table.user_id),
  user_created_idx: index("news_bookmarks_user_created_idx").on(table.user_id, table.created_at),
  unique_user_news: unique("news_bookmarks_unique").on(table.news_id, table.user_id),
}));

// ============================================================================
// UTILITY TABLES
// ============================================================================

/**
 * import_logs: Kaynak import geçmişi
 */
export const import_logs = pgTable("import_logs", {
  id: serial("id").primaryKey(),
  source_id: integer("source_id").references(() => sources.id),
  external_file: text("external_file"),
  imported_at: timestamp("imported_at").defaultNow().notNull(),
  imported_count: integer("imported_count"),
  meta: json("meta"),
}, (table) => ({
  source_idx: index("import_logs_source_id_idx").on(table.source_id),
  imported_at_idx: index("import_logs_imported_at_idx").on(table.imported_at),
}));