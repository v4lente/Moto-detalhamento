ALTER TABLE `customers`
  ADD COLUMN `document_type` varchar(4),
  ADD COLUMN `document_ciphertext` text,
  ADD COLUMN `document_hash` varchar(128),
  ADD COLUMN `document_masked` varchar(32),
  ADD COLUMN `document_key_version` int,
  ADD COLUMN `address_street` text,
  ADD COLUMN `address_number` varchar(20),
  ADD COLUMN `address_complement` text,
  ADD COLUMN `address_neighborhood` text,
  ADD COLUMN `address_city` text,
  ADD COLUMN `address_state` varchar(2),
  ADD COLUMN `address_postal_code` varchar(9),
  ADD COLUMN `profile_complete` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `orders`
  ADD COLUMN `total_decimal` decimal(12,2),
  ADD COLUMN `public_reference` varchar(24),
  ADD COLUMN `idempotency_key` varchar(200),
  ADD COLUMN `pricing_fingerprint` varchar(64),
  ADD COLUMN `document_masked` varchar(32),
  ADD COLUMN `address_snapshot` text;
--> statement-breakpoint
ALTER TABLE `order_items`
  ADD COLUMN `unit_price_decimal` decimal(12,2),
  ADD COLUMN `variation_id` bigint unsigned,
  ADD COLUMN `variation_label` text;
--> statement-breakpoint
ALTER TABLE `site_settings`
  ADD COLUMN `payments_card_enabled` boolean NOT NULL DEFAULT false,
  ADD COLUMN `payments_pix_enabled` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE `order_events` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `from_status` text,
  `to_status` text NOT NULL,
  `actor_type` varchar(16) NOT NULL,
  `actor_id` varchar(36),
  `reason` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `order_events_id` PRIMARY KEY(`id`),
  CONSTRAINT `order_events_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_document_hash_unique` ON `customers` (`document_hash`);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_public_reference_unique` ON `orders` (`public_reference`);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_customer_idempotency_unique` ON `orders` (`customer_id`, `idempotency_key`);
--> statement-breakpoint
CREATE INDEX `orders_customer_created_idx` ON `orders` (`customer_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `order_events_order_created_idx` ON `order_events` (`order_id`, `created_at`);
