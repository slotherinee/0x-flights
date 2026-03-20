CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"tracker_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"tracker_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"source" text DEFAULT 'stub' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trackers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"origin" char(3) NOT NULL,
	"destination" char(3) NOT NULL,
	"departure_date" date NOT NULL,
	"return_date" date,
	"price_threshold" numeric(10, 2) NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"adults" smallint DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tracker_id_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."trackers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prices" ADD CONSTRAINT "prices_tracker_id_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."trackers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trackers" ADD CONSTRAINT "trackers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_sent_at" ON "notifications" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prices_tracker_id" ON "prices" USING btree ("tracker_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prices_tracker_time" ON "prices" USING btree ("tracker_id","fetched_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trackers_user_id" ON "trackers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trackers_is_active" ON "trackers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trackers_route" ON "trackers" USING btree ("origin","destination","departure_date");