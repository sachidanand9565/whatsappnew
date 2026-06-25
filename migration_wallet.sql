-- ============================================================
-- Migration: Wallet & Template Message Billing
-- Run this against your whatsapp_saas database
-- ============================================================

USE whatsapp_saas;

-- Wallet balance per workspace (INR, 2 decimal places)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Per-category rate charged for each template message sent.
-- Mirrors templates.category — admin-configurable from Settings.
CREATE TABLE IF NOT EXISTS message_pricing (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category    ENUM('UTILITY','MARKETING','AUTHENTICATION') NOT NULL UNIQUE,
  rate        DECIMAL(10,4) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO message_pricing (category, rate) VALUES
  ('UTILITY', 0.35),
  ('MARKETING', 0.78),
  ('AUTHENTICATION', 0.35)
ON DUPLICATE KEY UPDATE category = category;

-- Ledger of every wallet credit/debit
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id    INT NOT NULL,
  type            ENUM('credit','debit') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  balance_after   DECIMAL(10,2) NOT NULL,
  reason          VARCHAR(255) NOT NULL,
  reference_type  VARCHAR(50) NULL,         -- 'message' | 'campaign' | 'razorpay' | 'manual'
  reference_id    VARCHAR(100) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_ws_created (workspace_id, created_at)
) ENGINE=InnoDB;

-- Razorpay recharge orders
CREATE TABLE IF NOT EXISTS wallet_recharges (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id          INT NOT NULL,
  razorpay_order_id     VARCHAR(100) NOT NULL,
  razorpay_payment_id   VARCHAR(100) NULL,
  amount                DECIMAL(10,2) NOT NULL,
  status                ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_ws (workspace_id),
  INDEX idx_order (razorpay_order_id)
) ENGINE=InnoDB;
