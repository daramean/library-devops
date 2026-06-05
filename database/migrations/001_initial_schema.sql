-- ════════════════════════════════════════════════════════
--  OBITO STORE Library DB — Full Schema
--  Run order: this file is the complete migration
-- ════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Roles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'user', 'librarian'
  permissions JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, permissions) VALUES
  ('admin',     '["all"]'),
  ('librarian', '["books.manage","borrows.manage","returns.manage","users.view"]'),
  ('user',      '["books.view","borrows.create","returns.create"]')
ON CONFLICT DO NOTHING;

-- ── Users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id         INT NOT NULL REFERENCES roles(id) DEFAULT 3,
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  phone           VARCHAR(20),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verify_token TEXT,
  reset_token     TEXT,
  reset_token_expires TIMESTAMPTZ,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Categories ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color       VARCHAR(7) DEFAULT '#000000',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, description, color) VALUES
  ('Fiction',        'Novels and short stories',          '#6366f1'),
  ('Non-Fiction',    'Factual and informational',         '#f59e0b'),
  ('Science',        'Natural and applied sciences',      '#10b981'),
  ('Technology',     'Computing, engineering, IT',        '#3b82f6'),
  ('History',        'Historical accounts and analysis',  '#ef4444'),
  ('Biography',      'Life stories',                      '#8b5cf6'),
  ('Philosophy',     'Ethics, logic, metaphysics',        '#ec4899'),
  ('Children',       'Books for young readers',           '#f97316')
ON CONFLICT DO NOTHING;

-- ── Books ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     INT REFERENCES categories(id),
  title           VARCHAR(255) NOT NULL,
  author          VARCHAR(255) NOT NULL,
  isbn            VARCHAR(20) UNIQUE,
  publisher       VARCHAR(255),
  publish_year    SMALLINT,
  description     TEXT,
  cover_url       TEXT,
  total_copies    INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  location        VARCHAR(100),  -- shelf location e.g. "A-12"
  language        VARCHAR(50) DEFAULT 'English',
  pages           INT,
  default_loan_days INT,
  tags            TEXT[],
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT available_lte_total CHECK (available_copies <= total_copies)
);

ALTER TABLE books ADD COLUMN IF NOT EXISTS default_loan_days INT;

-- ── Borrow Records ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS borrow_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  borrowed_at     TIMESTAMPTZ DEFAULT NOW(),
  due_date        TIMESTAMPTZ NOT NULL,
  returned_at     TIMESTAMPTZ,
  status          VARCHAR(20) DEFAULT 'borrowed'  -- 'borrowed','returned','overdue','lost','pending','rejected'
                  CHECK (status IN ('borrowed','returned','overdue','lost','pending','rejected')),
  notes           TEXT,
  approved_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE borrow_records
  DROP CONSTRAINT IF EXISTS borrow_records_status_check,
  ADD CONSTRAINT borrow_records_status_check
    CHECK (status IN ('borrowed','returned','overdue','lost','pending','rejected'));

-- ── Return Records ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrow_id       UUID NOT NULL REFERENCES borrow_records(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  book_id         UUID NOT NULL REFERENCES books(id),
  returned_at     TIMESTAMPTZ DEFAULT NOW(),
  condition       VARCHAR(20) DEFAULT 'good'  -- 'good','damaged','lost'
                  CHECK (condition IN ('good','damaged','lost')),
  processed_by    UUID REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Fines ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrow_id       UUID NOT NULL REFERENCES borrow_records(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  reason          VARCHAR(50) DEFAULT 'overdue'  -- 'overdue','damage','lost'
                  CHECK (reason IN ('overdue','damage','lost')),
  days_overdue    INT DEFAULT 0,
  is_paid         BOOLEAN DEFAULT FALSE,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reservations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  book_id         UUID NOT NULL REFERENCES books(id),
  reserved_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','fulfilled','cancelled','expired')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Favorites ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id    UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

-- ── Activity Logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,  -- 'book.borrow', 'user.login', etc.
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'info'  -- 'info','warning','overdue','fine'
              CHECK (type IN ('info','warning','overdue','fine','success')),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
--  INDEXES
-- ════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn         ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category     ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_title        ON books USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_author       ON books USING GIN (to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS idx_borrow_user        ON borrow_records(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_book        ON borrow_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_status      ON borrow_records(status);
CREATE INDEX IF NOT EXISTS idx_borrow_due         ON borrow_records(due_date);
CREATE INDEX IF NOT EXISTS idx_fines_user         ON fines(user_id);
CREATE INDEX IF NOT EXISTS idx_fines_unpaid       ON fines(is_paid) WHERE is_paid = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_user      ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created   ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ════════════════════════════════════════════════════════
--  TRIGGERS — auto update `updated_at`
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','books','borrow_records','fines'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
--  DEFAULT ADMIN USER
--  Note: Seed user creation is intentionally omitted from version-controlled migrations.
--  Create administrative accounts through secure deployment scripts or manual provisioning.
-- ════════════════════════════════════════════════════════

