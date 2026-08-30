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

// Very basic automatic migration/initialization for the desktop POS
export function initDB() {
  // Ensure settings table exists (unconditionally, so existing databases get upgraded seamlessly)
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
    
    // Create tables manually to avoid relying on complex migration pipelines in ASAR
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
        cashier_id TEXT,
        customer_id TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (cashier_id) REFERENCES cashiers(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
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
    const insertCashier = sqlite.prepare('INSERT INTO cashiers (id, name, pin, role) VALUES (?, ?, ?, ?)');
    insertCashier.run(randomUUID(), 'Admin', '1234', 'admin');
    insertCashier.run(randomUUID(), 'Staff', '5555', 'cashier');
    
    // Seed default products for YOLO BITE
    const insertProduct = sqlite.prepare('INSERT INTO products (id, name, price, category, image, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const now = Date.now();
    
    // Mocktails
    insertProduct.run(randomUUID(), 'Kiwi Breeze', 100, 'Mocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Swimming pool', 100, 'Mocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Chapman', 100, 'Mocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Virgin Mojito', 100, 'Mocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Safe sex on the beach', 100, 'Mocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Virgin Colada', 100, 'Mocktails', 'drink.png', 50, now);

    // Cocktails
    insertProduct.run(randomUUID(), 'Sex on the beach', 100, 'Cocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Cosmopolitan', 100, 'Cocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Long island', 100, 'Cocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Adiós moderfucka', 100, 'Cocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Blue Lagoon', 100, 'Cocktails', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Tequila sunrise', 100, 'Cocktails', 'drink.png', 50, now);

    // Smoothies
    insertProduct.run(randomUUID(), 'Sunburst', 100, 'Smoothies', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Nutty Banana', 100, 'Smoothies', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Heart beet', 100, 'Smoothies', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Strawberry cloud', 100, 'Smoothies', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Mixed fruit', 100, 'Smoothies', 'drink.png', 50, now);

    // Milkshakes
    insertProduct.run(randomUUID(), 'Oreos shake', 100, 'Milkshakes', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Strawberry shake', 100, 'Milkshakes', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Vanilla shake', 100, 'Milkshakes', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Chocolate shake', 100, 'Milkshakes', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Banana  shake', 100, 'Milkshakes', 'drink.png', 50, now);

    // Juices
    insertProduct.run(randomUUID(), 'Citrus glow', 100, 'Juices', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Fresh pineapple juice', 100, 'Juices', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Tropical sunrise(pineapple, orange, watermelon)', 100, 'Juices', 'drink.png', 50, now);
    insertProduct.run(randomUUID(), 'Ginger Zing', 100, 'Juices', 'drink.png', 50, now);
    
    console.log('Database initialized successfully with seeded data.');
  }
}
