-- ============================================================
-- Flow Builder Schema
-- Run this on existing whatsapp_saas database
-- ============================================================

-- ============================================================
-- 1. FLOWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS flows (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id      INT NOT NULL,
  name              VARCHAR(150) NOT NULL,
  description       VARCHAR(500) DEFAULT NULL,
  trigger_keywords  JSON NOT NULL DEFAULT ('[]'),    -- ["hi","hello","start"]
  trigger_type      ENUM('keyword','any','none') DEFAULT 'keyword',
  nodes             JSON NOT NULL DEFAULT ('{}'),    -- full flow JSON
  edges             JSON NOT NULL DEFAULT ('[]'),    -- react flow edges
  is_active         TINYINT(1) DEFAULT 0,
  version           INT DEFAULT 1,                   -- optimistic locking
  triggered_count   INT DEFAULT 0,                   -- analytics
  completed_count   INT DEFAULT 0,
  created_by        INT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)   REFERENCES users(id)      ON DELETE SET NULL,
  INDEX idx_workspace_active (workspace_id, is_active),
  INDEX idx_updated          (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. FLOW SESSIONS TABLE
-- Active conversations tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS flow_sessions (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  workspace_id     INT NOT NULL,
  flow_id          INT NOT NULL,
  contact_id       INT NOT NULL,
  current_node_id  VARCHAR(100) NOT NULL,            -- which node is user at
  variables        JSON NOT NULL DEFAULT ('{}'),     -- collected data {name, email, order_id}
  status           ENUM('active','completed','expired','error') DEFAULT 'active',
  started_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at       TIMESTAMP NOT NULL,               -- auto expire after 24h
  completed_at     TIMESTAMP NULL DEFAULT NULL,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (flow_id)      REFERENCES flows(id)      ON DELETE CASCADE,
  FOREIGN KEY (contact_id)   REFERENCES contacts(id)   ON DELETE CASCADE,

  -- One active session per contact per workspace
  UNIQUE KEY uq_active_contact (workspace_id, contact_id, status),
  INDEX idx_contact_status  (contact_id, status),
  INDEX idx_expires         (expires_at),
  INDEX idx_workspace       (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. FLOW ANALYTICS TABLE
-- Daily stats per flow
-- ============================================================
CREATE TABLE IF NOT EXISTS flow_analytics (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  flow_id        INT NOT NULL,
  workspace_id   INT NOT NULL,
  date           DATE NOT NULL,
  triggered      INT DEFAULT 0,
  completed      INT DEFAULT 0,
  dropped        INT DEFAULT 0,   -- left in between
  errors         INT DEFAULT 0,

  UNIQUE KEY uq_flow_date (flow_id, date),
  FOREIGN KEY (flow_id)      REFERENCES flows(id)      ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_workspace_date   (workspace_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. FLOW NODE LOGS (optional - for debugging)
-- ============================================================
CREATE TABLE IF NOT EXISTS flow_node_logs (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id   BIGINT NOT NULL,
  flow_id      INT NOT NULL,
  contact_id   INT NOT NULL,
  node_id      VARCHAR(100) NOT NULL,
  node_type    VARCHAR(50) NOT NULL,
  input        TEXT DEFAULT NULL,       -- user input that triggered
  output       TEXT DEFAULT NULL,       -- what was sent/done
  status       ENUM('success','error','skipped') DEFAULT 'success',
  error_msg    TEXT DEFAULT NULL,
  executed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES flow_sessions(id) ON DELETE CASCADE,
  INDEX idx_session (session_id),
  INDEX idx_flow    (flow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
