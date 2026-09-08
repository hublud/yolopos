/**
 * sync_products_to_local.mjs
 * 
 * One-time script: Imports all products from Supabase into dev.db.
 * Also seeds the correct cashier IDs used by supabaseApi ('cashier-admin', 'cashier-staff').
 * Also imports the single historical order from Supabase.
 * 
 * Run with: node scripts/sync_products_to_local.mjs
 */

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'dev.db')

const SUPABASE_URL = 'https://jfehfblygghjzwvgrjmk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTQ4NTEsImV4cCI6MjEwMzYzMDg1MX0.LzsFknA88zyLen8coDhM1xKEkdfQznGd1lU9nls0Hws'

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json'
}

async function fetchFromSupabase(table, extra = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${extra}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Supabase fetch failed for ${table}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = OFF') // Disable FK during import

  console.log('📡 Fetching data from Supabase...')

  const [products, cashiers, orders, orderItems] = await Promise.all([
    fetchFromSupabase('products', '&order=name.asc'),
    fetchFromSupabase('cashiers'),
    fetchFromSupabase('orders', '&order=created_at.desc'),
    fetchFromSupabase('order_items').catch(() => [])
  ])

  console.log(`  ✓ ${products.length} products`)
  console.log(`  ✓ ${cashiers.length} cashiers`)
  console.log(`  ✓ ${orders.length} orders`)
  console.log(`  ✓ ${orderItems.length} order items`)

  // ── Run any pending migrations first ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0
    );
  `)
  
  // Safe column additions
  const safeAdd = (table, col, def) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`) } catch {}
  }
  safeAdd('orders', 'payment_method', "TEXT NOT NULL DEFAULT 'cash'")
  safeAdd('orders', 'synced', "INTEGER NOT NULL DEFAULT 1") // Existing orders are already synced
  safeAdd('products', 'variants', "TEXT NOT NULL DEFAULT '[]'")
  safeAdd('order_items', 'variant_name', "TEXT")

  // ── Import Cashiers ───────────────────────────────────────────────────────────
  console.log('\n👤 Syncing cashiers...')
  const insertCashier = db.prepare(`
    INSERT OR REPLACE INTO cashiers (id, name, pin, role)
    VALUES (?, ?, ?, ?)
  `)
  for (const c of cashiers) {
    insertCashier.run(c.id, c.name, c.pin, c.role || 'cashier')
    console.log(`  ✓ ${c.name} [${c.role}] (${c.id})`)
  }

  // ── Import Products ───────────────────────────────────────────────────────────
  console.log('\n🛍️  Syncing products from Supabase...')
  
  // Clear out old wrong products
  const oldCount = db.prepare('SELECT COUNT(*) as cnt FROM products').get().cnt
  if (oldCount > 0) {
    console.log(`  ℹ️  Clearing ${oldCount} old local products...`)
    db.exec('DELETE FROM inventory_logs')
    db.exec('DELETE FROM order_items')
    db.exec('DELETE FROM orders')
    db.exec('DELETE FROM products')
  }

  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (id, name, price, category, image, stock, variants, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  let importedProducts = 0
  for (const p of products) {
    const variants = Array.isArray(p.variants) ? JSON.stringify(p.variants) : (p.variants || '[]')
    insertProduct.run(
      p.id,
      p.name,
      Number(p.price) || 0,
      p.category,
      p.image || 'drink.png',
      Number(p.stock) || 50,
      variants,
      Number(p.created_at) || Date.now()
    )
    importedProducts++
  }
  console.log(`  ✓ Imported ${importedProducts} products`)

  // ── Import Historical Orders from Supabase ────────────────────────────────────
  if (orders.length > 0) {
    console.log('\n📦 Importing historical orders...')
    const insertOrder = db.prepare(`
      INSERT OR IGNORE INTO orders (id, order_number, total, discount, tax, status, payment_method, cashier_id, customer_id, created_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `)
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO order_items (id, order_id, product_id, variant_name, quantity, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const o of orders) {
      insertOrder.run(
        o.id,
        o.order_number || o.orderNumber || randomUUID().substring(0, 6),
        Number(o.total) || 0,
        Number(o.discount) || 0,
        Number(o.tax) || 0,
        o.status || 'completed',
        o.payment_method || 'cash',
        o.cashier_id || null,
        o.customer_id || null,
        Number(o.created_at) || Date.now()
      )
      console.log(`  ✓ Order #${o.order_number} — ₦${o.total}`)
    }

    // Import order items
    for (const item of orderItems) {
      insertItem.run(
        item.id || randomUUID(),
        item.order_id,
        item.product_id,
        item.variant_name || null,
        Number(item.quantity) || 1,
        Number(item.price) || 0
      )
    }
  }

  // ── Verification ──────────────────────────────────────────────────────────────
  console.log('\n✅ Verification:')
  const counts = {
    cashiers: db.prepare('SELECT COUNT(*) as c FROM cashiers').get().c,
    products: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    order_items: db.prepare('SELECT COUNT(*) as c FROM order_items').get().c,
  }
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count} records`)
  }

  console.log('\n📊 Products by category:')
  const byCategory = db.prepare('SELECT category, COUNT(*) as cnt FROM products GROUP BY category ORDER BY category').all()
  for (const row of byCategory) {
    console.log(`  ${row.category}: ${row.cnt}`)
  }

  db.pragma('foreign_keys = ON')
  db.close()
  console.log('\n🎉 Done! dev.db is now in sync with Supabase.')
}

main().catch(err => {
  console.error('❌ Import failed:', err)
  process.exit(1)
})
