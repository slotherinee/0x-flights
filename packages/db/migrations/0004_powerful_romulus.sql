ALTER TABLE "trackers" ADD COLUMN "departure_offset" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trackers" ADD COLUMN "return_offset" smallint DEFAULT 0 NOT NULL;
