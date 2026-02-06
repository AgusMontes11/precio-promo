CREATE TABLE IF NOT EXISTS matinal_sales_status (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  codigo_pdv TEXT NOT NULL,
  sold BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, codigo_pdv)
);

CREATE INDEX IF NOT EXISTS matinal_sales_status_user_idx
  ON matinal_sales_status (user_id);
