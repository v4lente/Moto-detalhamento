ALTER TABLE `appointments`
  ADD COLUMN `payment_status` varchar(16) NOT NULL DEFAULT 'nao_pago' AFTER `status`;
