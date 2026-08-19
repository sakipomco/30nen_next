ALTER TABLE `uploads` ADD `content_hash` text;--> statement-breakpoint
CREATE INDEX `uploads_hash_owner_idx` ON `uploads` (`content_hash`,`uploaded_by`);