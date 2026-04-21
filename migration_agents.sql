-- ============================================================
-- Migration: Agent Role System
-- Run this against your whatsapp_saas database
-- ============================================================

USE whatsapp_saas;

-- 0. Add 'system' to messages.type ENUM (for intervene/resolve/reopen events)
ALTER TABLE messages
  MODIFY COLUMN type ENUM('text','image','document','audio','video','template','interactive','reaction','location','contacts','sticker','unknown','button','system') DEFAULT 'text';

-- 0b. Fix any existing system messages where created_at is NULL (caused ordering bug)
UPDATE messages SET created_at = sent_at WHERE created_at IS NULL AND sent_at IS NOT NULL;
UPDATE messages SET created_at = NOW() WHERE created_at IS NULL;

-- 0c. Add api_key to workspaces for external chatbot authentication
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) DEFAULT NULL;

-- Generate a key for any workspace that doesn't have one yet
UPDATE workspaces SET api_key = CONCAT('ws_', REPLACE(UUID(), '-', '')) WHERE api_key IS NULL;

-- 1. Add 'manager' to role ENUMs
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','manager','agent') DEFAULT 'agent';

ALTER TABLE workspace_members
  MODIFY COLUMN role ENUM('admin','manager','agent') DEFAULT 'agent';

-- 2. Add phone number column to users (for agent WhatsApp number)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL AFTER email;

-- 3. Campaign assignments: which agent is assigned to which campaign
CREATE TABLE IF NOT EXISTS campaign_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id  INT NOT NULL,
  agent_id     INT NOT NULL,
  assigned_by  INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_campaign_agent (campaign_id, agent_id),
  FOREIGN KEY (campaign_id)  REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (assigned_by)  REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB;
