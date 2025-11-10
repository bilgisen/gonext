CREATE TABLE "news_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"news_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_favorites_unique" UNIQUE("news_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
DROP TABLE "news_reactions" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "push_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "news_favorites" ADD CONSTRAINT "news_favorites_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_favorites" ADD CONSTRAINT "news_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_favorites_news_id_idx" ON "news_favorites" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_favorites_user_id_idx" ON "news_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_subscriptions_user_id_idx" ON "notification_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_subscriptions_endpoint_idx" ON "notification_subscriptions" USING btree ("endpoint");