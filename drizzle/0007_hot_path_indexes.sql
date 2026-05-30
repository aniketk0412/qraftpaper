CREATE INDEX "documents_subject_idx" ON "documents" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "papers_user_created_idx" ON "papers" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "papers_user_subject_idx" ON "papers" USING btree ("user_id","subject_id");--> statement-breakpoint
CREATE INDEX "quizzes_user_created_idx" ON "quizzes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "quizzes_user_subject_idx" ON "quizzes" USING btree ("user_id","subject_id");