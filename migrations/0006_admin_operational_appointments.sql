ALTER TABLE `offered_services`
  ADD COLUMN `estimated_duration_minutes` int NOT NULL DEFAULT 60 AFTER `approximate_price`;
--> statement-breakpoint
ALTER TABLE `appointments`
  MODIFY COLUMN `service_description` text NULL,
  MODIFY COLUMN `preferred_date` timestamp NULL,
  ADD COLUMN `start_at` timestamp NULL AFTER `confirmed_date`,
  ADD COLUMN `planned_end_at` timestamp NULL AFTER `start_at`,
  ADD COLUMN `completed_at` timestamp NULL AFTER `planned_end_at`,
  ADD COLUMN `total_amount` decimal(12,2) NULL AFTER `estimated_price`,
  ADD COLUMN `archived_at` timestamp NULL AFTER `total_amount`,
  ADD COLUMN `budget_storage_key` varchar(255) NULL AFTER `archived_at`,
  ADD COLUMN `budget_original_name` varchar(255) NULL AFTER `budget_storage_key`,
  ADD COLUMN `budget_mime_type` varchar(100) NULL AFTER `budget_original_name`,
  ADD COLUMN `budget_source` varchar(16) NULL AFTER `budget_mime_type`,
  ADD COLUMN `budget_updated_at` timestamp NULL AFTER `budget_source`;
--> statement-breakpoint
UPDATE `appointments`
SET
  `start_at` = COALESCE(`confirmed_date`, `preferred_date`, `created_at`),
  `planned_end_at` = DATE_ADD(COALESCE(`confirmed_date`, `preferred_date`, `created_at`), INTERVAL 60 MINUTE),
  `status` = CASE
    WHEN `status` = 'pre_agendamento' THEN 'agendado_nao_iniciado'
    ELSE `status`
  END,
  `total_amount` = CASE
    WHEN `estimated_price` IS NULL THEN NULL
    ELSE ROUND(`estimated_price` / 100, 2)
  END;
--> statement-breakpoint
ALTER TABLE `appointments`
  MODIFY COLUMN `start_at` timestamp NOT NULL,
  MODIFY COLUMN `planned_end_at` timestamp NOT NULL,
  MODIFY COLUMN `status` varchar(32) NOT NULL DEFAULT 'agendado_nao_iniciado';
--> statement-breakpoint
CREATE TABLE `appointment_items` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `appointment_id` bigint unsigned NOT NULL,
  `service_id` bigint unsigned NULL,
  `service_name` text NOT NULL,
  `description` text NOT NULL,
  `duration_minutes` int NOT NULL,
  `agreed_amount` decimal(12,2) NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `appointment_items_id` PRIMARY KEY (`id`),
  CONSTRAINT `appointment_items_appointment_id_appointments_id_fk`
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_items_service_id_offered_services_id_fk`
    FOREIGN KEY (`service_id`) REFERENCES `offered_services` (`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `appointment_items` (
  `appointment_id`,
  `service_id`,
  `service_name`,
  `description`,
  `duration_minutes`,
  `agreed_amount`,
  `sort_order`
)
SELECT
  `id`,
  NULL,
  'Serviço legado',
  COALESCE(NULLIF(`service_description`, ''), 'Serviço não informado'),
  60,
  `total_amount`,
  0
FROM `appointments`;
--> statement-breakpoint
CREATE INDEX `appointments_start_status_idx` ON `appointments` (`start_at`, `status`);
--> statement-breakpoint
CREATE INDEX `appointments_archived_idx` ON `appointments` (`archived_at`);
--> statement-breakpoint
CREATE INDEX `appointment_items_appointment_idx` ON `appointment_items` (`appointment_id`);
--> statement-breakpoint
CREATE INDEX `appointment_items_service_idx` ON `appointment_items` (`service_id`);
