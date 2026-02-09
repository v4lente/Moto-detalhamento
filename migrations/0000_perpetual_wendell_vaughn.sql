CREATE TABLE `appointments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_id` varchar(36),
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`vehicle_info` text NOT NULL,
	`service_description` text NOT NULL,
	`preferred_date` timestamp NOT NULL,
	`confirmed_date` timestamp,
	`status` text NOT NULL,
	`admin_notes` text,
	`estimated_price` float,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`nickname` text,
	`delivery_address` text,
	`password` text,
	`is_registered` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offered_services` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`details` text NOT NULL,
	`approximate_price` float,
	`example_work_id` bigint unsigned,
	`is_active` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offered_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned,
	`product_name` text NOT NULL,
	`product_price` float NOT NULL,
	`quantity` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_id` varchar(36),
	`status` text NOT NULL,
	`total` float NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`delivery_address` text,
	`whatsapp_message` text,
	`payment_method` text,
	`payment_status` text,
	`stripe_session_id` text,
	`stripe_payment_intent_id` text,
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`image_url` text NOT NULL,
	`sort_order` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`label` text NOT NULL,
	`price` float NOT NULL,
	`in_stock` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_variations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` float NOT NULL,
	`image` text NOT NULL,
	`category` text NOT NULL,
	`in_stock` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`customer_id` varchar(36),
	`customer_name` text NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_post_media` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`service_post_id` bigint unsigned NOT NULL,
	`media_url` text NOT NULL,
	`media_type` text NOT NULL,
	`sort_order` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_post_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_posts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`client_name` text,
	`vehicle_info` text,
	`featured` boolean,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int NOT NULL,
	`whatsapp_number` text NOT NULL,
	`site_name` text NOT NULL,
	`site_tagline` text NOT NULL,
	`hero_title` text NOT NULL,
	`hero_title_line2` text,
	`hero_subtitle` text NOT NULL,
	`footer_text` text NOT NULL,
	`copyright_text` text NOT NULL,
	`logo_image` text,
	`background_image` text,
	`business_address` text,
	`instagram_url` text,
	`facebook_url` text,
	`youtube_url` text,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offered_services` ADD CONSTRAINT `offered_services_example_work_id_service_posts_id_fk` FOREIGN KEY (`example_work_id`) REFERENCES `service_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variations` ADD CONSTRAINT `product_variations_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_post_media` ADD CONSTRAINT `service_post_media_service_post_id_service_posts_id_fk` FOREIGN KEY (`service_post_id`) REFERENCES `service_posts`(`id`) ON DELETE cascade ON UPDATE no action;