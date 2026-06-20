CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`uploaded_by` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploads_path_unique` ON `uploads` (`path`);