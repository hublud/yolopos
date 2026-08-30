-- YOLO BITES POS Supabase Database Schema

-- 1. Cashiers Table
CREATE TABLE IF NOT EXISTS cashiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier'
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT 'drink.png',
  stock INTEGER NOT NULL DEFAULT 0,
  variants JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  loyalty_points INTEGER NOT NULL DEFAULT 0
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  total NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  cashier_id TEXT REFERENCES cashiers(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- 6. Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  business_name TEXT NOT NULL,
  tax_rate NUMERIC NOT NULL,
  receipt_address TEXT NOT NULL,
  phones TEXT NOT NULL
);

-- Enable Row Level Security (RLS) and grant open access for POS client operations
ALTER TABLE cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Public full access cashiers" ON cashiers;
  DROP POLICY IF EXISTS "Public full access products" ON products;
  DROP POLICY IF EXISTS "Public full access customers" ON customers;
  DROP POLICY IF EXISTS "Public full access orders" ON orders;
  DROP POLICY IF EXISTS "Public full access order_items" ON order_items;
  DROP POLICY IF EXISTS "Public full access inventory_logs" ON inventory_logs;
  DROP POLICY IF EXISTS "Public full access settings" ON settings;
END $$;

CREATE POLICY "Public full access cashiers" ON cashiers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access inventory_logs" ON inventory_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access settings" ON settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Realtime for live POS synchronization across devices
ALTER PUBLICATION supabase_realtime ADD TABLE products, orders, order_items, cashiers, customers, inventory_logs, settings;
