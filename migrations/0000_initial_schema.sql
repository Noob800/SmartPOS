
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  mpesa_ref TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL
);

-- Create stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  normal_balance TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  parent_account_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  entry_date TIMESTAMP NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  debit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  credit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key constraints with cascade rules
ALTER TABLE sales ADD CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
ALTER TABLE stock_adjustments ADD CONSTRAINT fk_stock_adjustments_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
ALTER TABLE stock_adjustments ADD CONSTRAINT fk_stock_adjustments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_parent FOREIGN KEY (parent_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ledger_entries ADD CONSTRAINT fk_ledger_entries_journal FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
ALTER TABLE ledger_entries ADD CONSTRAINT fk_ledger_entries_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;

-- Add check constraints for data validation
ALTER TABLE products ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_cost_positive CHECK (cost_price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0);
ALTER TABLE sale_items ADD CONSTRAINT chk_sale_items_quantity_positive CHECK (quantity > 0);
ALTER TABLE sale_items ADD CONSTRAINT chk_sale_items_price_positive CHECK (unit_price >= 0);
ALTER TABLE stock_adjustments ADD CONSTRAINT chk_stock_adjustments_quantity_non_zero CHECK (quantity != 0);
ALTER TABLE ledger_entries ADD CONSTRAINT chk_ledger_entries_debit_credit CHECK (
  (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
);

-- Create indexes for better performance
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_user_id ON stock_adjustments(user_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);
CREATE INDEX idx_accounts_parent_id ON accounts(parent_account_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_ledger_entries_journal_id ON ledger_entries(journal_entry_id);
CREATE INDEX idx_ledger_entries_account_id ON ledger_entries(account_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);

-- Add comments to tables for documentation
COMMENT ON TABLE users IS 'System users (admins and cashiers)';
COMMENT ON TABLE products IS 'Product catalog with inventory tracking';
COMMENT ON TABLE sales IS 'Sales transactions';
COMMENT ON TABLE sale_items IS 'Line items for each sale';
COMMENT ON TABLE stock_adjustments IS 'Inventory adjustments (restocking, spoilage, etc.)';
COMMENT ON TABLE settings IS 'System configuration key-value pairs';
COMMENT ON TABLE accounts IS 'Chart of accounts for double-entry bookkeeping';
COMMENT ON TABLE journal_entries IS 'Journal entry headers';
COMMENT ON TABLE ledger_entries IS 'Individual debit/credit entries in the general ledger';
