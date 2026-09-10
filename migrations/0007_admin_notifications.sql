CREATE TABLE `admin_notifications` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `type` varchar(40) NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`),
  CONSTRAINT `admin_notifications_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_notifications_order_type_unique` ON `admin_notifications` (`order_id`, `type`);
--> statement-breakpoint
CREATE INDEX `admin_notifications_created_idx` ON `admin_notifications` (`created_at`);
--> statement-breakpoint
CREATE TABLE `admin_notification_reads` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `notification_id` bigint unsigned NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `admin_notification_reads_id` PRIMARY KEY(`id`),
  CONSTRAINT `admin_notification_reads_notification_fk` FOREIGN KEY (`notification_id`) REFERENCES `admin_notifications`(`id`) ON DELETE cascade,
  CONSTRAINT `admin_notification_reads_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_notification_reads_notification_user_unique` ON `admin_notification_reads` (`notification_id`, `user_id`);
--> statement-breakpoint
CREATE INDEX `admin_notification_reads_user_read_idx` ON `admin_notification_reads` (`user_id`, `read_at`);
