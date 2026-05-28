WITH ranked_subjects AS (
	SELECT
		"id",
		"code",
		row_number() OVER (
			PARTITION BY "user_id", lower("code")
			ORDER BY "created_at" ASC NULLS LAST, "id" ASC
		) AS duplicate_rank
	FROM "subjects"
)
UPDATE "subjects"
SET "code" = ranked_subjects."code" || '-' || ranked_subjects.duplicate_rank
FROM ranked_subjects
WHERE "subjects"."id" = ranked_subjects."id"
	AND ranked_subjects.duplicate_rank > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_user_code_lower_idx" ON "subjects" USING btree ("user_id",lower("code"));
