-- ═══════════════════════════════════════════════════════
--  SmartCV – Database Update
--  Run in: phpMyAdmin → user_cv → SQL tab → Execute
-- ═══════════════════════════════════════════════════════
USE user_cv;

-- ── profiles: add missing columns ─────────────────────
-- Existing: id, full_name, avatar_url, role, email, created_at
ALTER TABLE profiles
  ADD COLUMN user_id    INT          UNIQUE        AFTER id,
  ADD COLUMN bio        TEXT         DEFAULT NULL  AFTER avatar_url,
  ADD COLUMN phone      VARCHAR(50)  DEFAULT NULL  AFTER bio,
  ADD COLUMN address    VARCHAR(255) DEFAULT NULL  AFTER phone,
  ADD COLUMN updated_at DATETIME     DEFAULT NOW() ON UPDATE NOW() AFTER created_at;

-- (If any column already exists, comment that line out and re-run)

-- ── cvs: add updated_at, fix data type ───────────────
-- Existing: id, user_id, title, template, data, created_at
ALTER TABLE cvs
  MODIFY COLUMN data JSON,
  ADD COLUMN updated_at DATETIME DEFAULT NOW() ON UPDATE NOW() AFTER created_at;

-- ── indexes ────────────────────────────────────────────
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_cvs_user      ON cvs(user_id);
CREATE INDEX idx_cvs_updated   ON cvs(updated_at DESC);

-- ── reviews: new table for user ratings ───────────────
CREATE TABLE reviews (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);