CREATE TABLE `sensitive_data_access_events` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `action` varchar(64) NOT NULL,
  `purpose` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `sensitive_data_access_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sensitive_data_access_user_created_idx` ON `sensitive_data_access_events` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `sensitive_data_access_customer_created_idx` ON `sensitive_data_access_events` (`customer_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `sensitive_data_access_order_created_idx` ON `sensitive_data_access_events` (`order_id`, `created_at`);
