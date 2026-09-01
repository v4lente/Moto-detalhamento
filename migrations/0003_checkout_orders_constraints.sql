UPDATE `orders` SET `total_decimal` = ROUND(`total`, 2) WHERE `total_decimal` IS NULL;
--> statement-breakpoint
UPDATE `order_items` SET `unit_price_decimal` = ROUND(`product_price`, 2) WHERE `unit_price_decimal` IS NULL;
--> statement-breakpoint
UPDATE `orders` SET `public_reference` = CONCAT('LEGACY-', `id`) WHERE `public_reference` IS NULL;
--> statement-breakpoint
ALTER TABLE `orders`
  MODIFY COLUMN `total_decimal` decimal(12,2) NOT NULL,
  MODIFY COLUMN `public_reference` varchar(24) NOT NULL;
--> statement-breakpoint
ALTER TABLE `order_items`
  MODIFY COLUMN `unit_price_decimal` decimal(12,2) NOT NULL;
