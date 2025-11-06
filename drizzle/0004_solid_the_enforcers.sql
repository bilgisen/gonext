ALTER TABLE "news" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "news_view_count_idx" ON "news" USING btree ("view_count");