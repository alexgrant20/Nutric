CREATE TABLE `accolade_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accolade_id` integer NOT NULL,
	`lang` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image_alt` text,
	FOREIGN KEY (`accolade_id`) REFERENCES `accolades`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accolade_translations_accolade_id_lang_unique` ON `accolade_translations` (`accolade_id`,`lang`);--> statement-breakpoint
CREATE TABLE `accolades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image` text NOT NULL,
	`year` integer,
	`issuer` text,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `collection_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer NOT NULL,
	`lang` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`description` text,
	`banner_alt` text,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_translations_collection_id_lang_unique` ON `collection_translations` (`collection_id`,`lang`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`banner_image` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`cover_image` text,
	`event_date` text,
	`location` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_unique` ON `news` (`slug`);--> statement-breakpoint
CREATE TABLE `news_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`news_id` integer NOT NULL,
	`lang` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body_md` text,
	`cover_alt` text,
	FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_translations_news_id_lang_unique` ON `news_translations` (`news_id`,`lang`);--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`position` integer NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_sections_key_unique` ON `page_sections` (`key`);--> statement-breakpoint
CREATE TABLE `product_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`lang` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text,
	`description_md` text,
	`benefits` text DEFAULT '[]' NOT NULL,
	`ingredients_md` text,
	`how_to_use_md` text,
	`faqs` text DEFAULT '[]' NOT NULL,
	`regulatory_text` text,
	`image_alt` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_translations_product_id_lang_unique` ON `product_translations` (`product_id`,`lang`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`collection_id` integer,
	`main_image` text,
	`gallery` text DEFAULT '[]' NOT NULL,
	`is_best_seller` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`brand_name` text NOT NULL,
	`logo_image` text,
	`hero_media` text,
	`hero_media_type` text DEFAULT 'image' NOT NULL,
	`hero_product_image` text,
	`contact_email` text,
	`contact_phone` text,
	`whatsapp_url` text,
	`social_links` text DEFAULT '[]' NOT NULL,
	`theme` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lang` text NOT NULL,
	`tagline` text,
	`headline_line1` text,
	`headline_line2` text,
	`subheadline` text,
	`cta_label` text,
	`hero_badge_text` text,
	`about_teaser_md` text,
	`about_md` text,
	`terms_md` text,
	`about_image_alt` text,
	`footer_note` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_settings_translations_lang_unique` ON `site_settings_translations` (`lang`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`lang` text DEFAULT 'en' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `testimonial_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`testimonial_id` integer NOT NULL,
	`lang` text NOT NULL,
	`title` text NOT NULL,
	`quote` text,
	FOREIGN KEY (`testimonial_id`) REFERENCES `testimonials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `testimonial_translations_testimonial_id_lang_unique` ON `testimonial_translations` (`testimonial_id`,`lang`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_name` text,
	`role` text,
	`avatar_image` text,
	`youtube_url` text,
	`poster_image` text,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
