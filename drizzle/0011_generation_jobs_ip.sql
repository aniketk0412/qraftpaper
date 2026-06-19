ALTER TABLE "generation_jobs" ADD COLUMN "ip_address" text;--> statement-breakpoint
CREATE INDEX "generation_jobs_ip_created_idx" ON "generation_jobs" USING btree ("ip_address","created_at");