CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'open', 'resolved', 'spam');--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "status" "inquiry_status" DEFAULT 'new' NOT NULL;--> statement-breakpoint
CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");