-- ============================================================
-- Migration: Manual UPI Wallet Recharge (admin-approved)
-- Run this against your whatsapp_saas database
-- Safe to run even if migration_wallet.sql was already applied —
-- it migrates wallet_recharges from the Razorpay-only shape to the
-- UPI + admin-approval shape.
-- ============================================================

USE whatsapp_saas;

ALTER TABLE wallet_recharges
  MODIFY COLUMN razorpay_order_id   VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS payment_method  ENUM('upi','razorpay') NOT NULL DEFAULT 'upi' AFTER workspace_id,
  ADD COLUMN IF NOT EXISTS utr_number      VARCHAR(100) NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS payment_note    VARCHAR(255) NULL AFTER utr_number,
  ADD COLUMN IF NOT EXISTS reviewed_by     INT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255) NULL;

-- Widen status to admin-approval workflow (created/paid/failed -> pending/approved/rejected)
ALTER TABLE wallet_recharges
  MODIFY COLUMN status ENUM('created','paid','failed','pending','approved','rejected') NOT NULL DEFAULT 'pending';

UPDATE wallet_recharges SET status = 'pending'  WHERE status = 'created';
UPDATE wallet_recharges SET status = 'approved' WHERE status = 'paid';
UPDATE wallet_recharges SET status = 'rejected' WHERE status = 'failed';

ALTER TABLE wallet_recharges
  MODIFY COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_ws_status ON wallet_recharges (workspace_id, status);
