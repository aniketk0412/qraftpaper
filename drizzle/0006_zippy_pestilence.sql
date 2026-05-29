CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"taker_user_id" uuid,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "exam_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "study_activity" ADD CONSTRAINT "study_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_idx" ON "quiz_attempts" USING btree ("quiz_id","created_at");--> statement-breakpoint
CREATE INDEX "quiz_attempts_taker_idx" ON "quiz_attempts" USING btree ("taker_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "study_activity_user_date_idx" ON "study_activity" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "study_activity_user_idx" ON "study_activity" USING btree ("user_id");