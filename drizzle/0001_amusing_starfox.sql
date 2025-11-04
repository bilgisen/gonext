CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"news_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_bookmarks_unique" UNIQUE("news_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "news_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"news_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"reaction_type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_reactions_unique" UNIQUE("news_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "news_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"news_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "news_tldr" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "news_tldr" CASCADE;--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_image_media_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "news_categories" DROP CONSTRAINT "news_categories_news_id_news_id_fk";
--> statement-breakpoint
ALTER TABLE "news_categories" DROP CONSTRAINT "news_categories_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "news_media" DROP CONSTRAINT "news_media_news_id_news_id_fk";
--> statement-breakpoint
ALTER TABLE "news_media" DROP CONSTRAINT "news_media_media_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "news_revisions" DROP CONSTRAINT "news_revisions_news_id_news_id_fk";
--> statement-breakpoint
ALTER TABLE "news_tags" DROP CONSTRAINT "news_tags_news_id_news_id_fk";
--> statement-breakpoint
ALTER TABLE "news_tags" DROP CONSTRAINT "news_tags_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "seo_title" varchar(255);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_bookmarks" ADD CONSTRAINT "news_bookmarks_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_bookmarks" ADD CONSTRAINT "news_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_views" ADD CONSTRAINT "news_views_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "news_bookmarks_news_id_idx" ON "news_bookmarks" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_bookmarks_user_id_idx" ON "news_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "news_bookmarks_user_created_idx" ON "news_bookmarks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "news_reactions_news_id_idx" ON "news_reactions" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_reactions_user_id_idx" ON "news_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "news_reactions_type_idx" ON "news_reactions" USING btree ("reaction_type");--> statement-breakpoint
CREATE INDEX "news_reactions_news_type_idx" ON "news_reactions" USING btree ("news_id","reaction_type");--> statement-breakpoint
CREATE INDEX "news_views_news_id_idx" ON "news_views" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_views_viewed_at_idx" ON "news_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "news_views_session_news_idx" ON "news_views" USING btree ("session_id","news_id","viewed_at");--> statement-breakpoint
CREATE INDEX "news_views_composite_idx" ON "news_views" USING btree ("news_id","viewed_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_media" ADD CONSTRAINT "news_media_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_media" ADD CONSTRAINT "news_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_revisions" ADD CONSTRAINT "news_revisions_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_active_order_idx" ON "categories" USING btree ("is_active","order");--> statement-breakpoint
CREATE UNIQUE INDEX "editors_email_idx" ON "editors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "editors_role_idx" ON "editors" USING btree ("role");--> statement-breakpoint
CREATE INDEX "import_logs_source_id_idx" ON "import_logs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "import_logs_imported_at_idx" ON "import_logs" USING btree ("imported_at");--> statement-breakpoint
CREATE INDEX "media_hash_idx" ON "media" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "media_storage_path_idx" ON "media" USING btree ("storage_path");--> statement-breakpoint
CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "news_source_guid_idx" ON "news" USING btree ("source_guid");--> statement-breakpoint
CREATE INDEX "news_status_idx" ON "news" USING btree ("status");--> statement-breakpoint
CREATE INDEX "news_published_at_idx" ON "news" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "news_status_published_idx" ON "news" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "news_source_fk_idx" ON "news" USING btree ("source_fk");--> statement-breakpoint
CREATE INDEX "news_editor_id_idx" ON "news" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "news_visibility_idx" ON "news" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "news_categories_news_id_idx" ON "news_categories" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_categories_category_id_idx" ON "news_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "news_media_news_id_idx" ON "news_media" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_media_media_id_idx" ON "news_media" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "news_media_position_idx" ON "news_media" USING btree ("news_id","position");--> statement-breakpoint
CREATE INDEX "news_revisions_news_id_idx" ON "news_revisions" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_revisions_editor_id_idx" ON "news_revisions" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "news_revisions_created_at_idx" ON "news_revisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "news_tags_news_id_idx" ON "news_tags" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_tags_tag_id_idx" ON "news_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "sources_name_idx" ON "sources" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "image_media_id";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "tldr_count";--> statement-breakpoint
ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_unique" UNIQUE("news_id","category_id");--> statement-breakpoint
ALTER TABLE "news_media" ADD CONSTRAINT "news_media_unique" UNIQUE("news_id","media_id");--> statement-breakpoint
ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_unique" UNIQUE("news_id","tag_id");