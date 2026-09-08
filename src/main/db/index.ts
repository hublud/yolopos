import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';
import fs from 'fs';
import { randomUUID } from 'crypto';

const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(process.cwd(), 'dev.db')
  : path.join(app.getPath('userData'), 'yolobite.db');

// Ensure directory exists in production
if (!isDev) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

/** Safe ALTER TABLE — ignores the error if column already exists */
function safeAddColumn(table: string, column: string, definition: string) {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  } catch {
    // Column already exists — ignore
  }
}

// Very basic automatic migration/initialization for the desktop POS
export function initDB() {
  // Ensure settings table exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL,
      tax_rate REAL NOT NULL,
      receipt_address TEXT NOT NULL,
      phones TEXT NOT NULL
    );
  `);

  // Seed default settings if empty
  const checkSettings = sqlite.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (checkSettings.count === 0) {
    sqlite.prepare(`
      INSERT INTO settings (id, business_name, tax_rate, receipt_address, phones) 
      VALUES (1, 'YOLO BITES', 10.0, 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA', '07013974928, 07044030444')
    `).run();
  }

  // Check if tables exist
  const tableCheck = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products';").get();
  
  if (!tableCheck) {
    console.log('Initializing database schema...');
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS cashiers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cashier'
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        variants TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        loyalty_points INTEGER NOT NULL DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        total REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'completed',
        payment_method TEXT NOT NULL DEFAULT 'cash',
        cashier_id TEXT,
        customer_id TEXT,
        created_at INTEGER NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (cashier_id) REFERENCES cashiers(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant_name TEXT,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
      
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        change INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Seed default cashiers
    const insertCashier = sqlite.prepare('INSERT OR IGNORE INTO cashiers (id, name, pin, role) VALUES (?, ?, ?, ?)');
    insertCashier.run('cashier-admin', 'Admin', '1282', 'admin');
    insertCashier.run('cashier-staff', 'Staff', '5555', 'cashier');
    
    console.log('Database schema initialized.');
  }

  // ── Migrations for existing databases ──────────────────────────────────────
  // These run safely on every startup and do nothing if columns already exist.

  safeAddColumn('orders', 'payment_method', "TEXT NOT NULL DEFAULT 'cash'");
  safeAddColumn('orders', 'synced', "INTEGER NOT NULL DEFAULT 0");
  safeAddColumn('products', 'variants', "TEXT NOT NULL DEFAULT '[]'");
  safeAddColumn('order_items', 'variant_name', "TEXT");

  // Create durable offline queue table (cloud-first fallback)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Ensure cashier seeds exist (for upgraded DBs that only had random UUIDs)
  const insertCashierIgnore = sqlite.prepare('INSERT OR IGNORE INTO cashiers (id, name, pin, role) VALUES (?, ?, ?, ?)');
  insertCashierIgnore.run('cashier-admin', 'Admin', '1282', 'admin');
  insertCashierIgnore.run('cashier-staff', 'Staff', '5555', 'cashier');

  console.log('DB ready:', dbPath);
}
