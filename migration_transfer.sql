-- ============================================================
-- Migration: Chat Transfer
-- Run this against your whatsapp_saas database
-- ============================================================

USE whatsapp_saas;

-- Direct agent assignment on a contact (set when chat is transferred)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS assigned_agent_id INT NULL,
  ADD INDEX IF NOT EXISTS idx_assigned_agent (assigned_agent_id);

-- Stored unread count — incremented by webhook, reset when agent opens the chat
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS unread_count INT NOT NULL DEFAULT 0;

-- Seed existing contacts with their current unread count
UPDATE contacts c
SET unread_count = (
  SELECT COUNT(*) FROM messages m
  WHERE m.contact_id = c.id AND m.direction = 'inbound'
    AND m.id > COALESCE(
      (SELECT MAX(m2.id) FROM messages m2
       WHERE m2.contact_id = c.id AND m2.direction = 'outbound'), 0
    )
);
