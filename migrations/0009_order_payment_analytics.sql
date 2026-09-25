ALTER TABLE `orders`
  ADD COLUMN `payment_tracking_mode` varchar(16) NOT NULL DEFAULT 'legacy' AFTER `payment_status`;
--> statement-breakpoint

UPDATE `orders`
SET `payment_tracking_mode` = 'legacy';
--> statement-breakpoint

ALTER TABLE `orders`
  ALTER COLUMN `payment_tracking_mode` SET DEFAULT 'explicit';
--> statement-breakpoint

CREATE TABLE `order_payment_events` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `from_payment_status` varchar(32),
  `to_payment_status` varchar(32) NOT NULL,
  `actor_type` varchar(16) NOT NULL,
  `actor_id` varchar(36),
  `source` varchar(24) NOT NULL,
  `reason` text,
  `request_key` varchar(200),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `order_payment_events_id` PRIMARY KEY(`id`),
  CONSTRAINT `order_payment_events_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `order_payment_events_order_request_unique` UNIQUE(`order_id`, `request_key`),
  INDEX `order_payment_events_order_created_idx` (`order_id`, `created_at`)
);
