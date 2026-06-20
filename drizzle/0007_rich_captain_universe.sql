CREATE UNIQUE INDEX `articles_wp_id_unique` ON `articles` (`wp_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_wp_term_id_unique` ON `categories` (`wp_term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_wp_id_unique` ON `users` (`wp_id`);