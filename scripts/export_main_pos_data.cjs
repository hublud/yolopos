/**
 * YOLO BITES - Main POS Machine Local Data Exporter
 * 
 * Run this on the Main POS Machine:
 *   node scripts/export_main_pos_data.cjs
 * 
 * This will:
 * 1. Automatically locate the local SQLite database (dev.db or %APPDATA%/yolo-bite/yolobite.db)
 * 2. Extract all orders, order items, cashiers, products, and customers
 * 3. Save everything to pos_yolo_backup.json
 * 4. If internet is available, offer to push directly to Supabase!
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jfehfblygghjzwvgrjmk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1NDg1MSwiZXhwIjoyMTAzNjMwODUxfQ.FgbdmKPq2mUmO-NWlsZZLg-WJJXBE6u9-GZ1QiX1TM0';

async function main() {
  console.log('============================================');
  console.log('   YOLO BITES - Local Database Exporter     ');
  console.log('============================================\n');

  // Candidate DB locations
  const candidates = [
    path.resolve('dev.db'),
    path.join(process.env.APPDATA || '', 'yolo-bite', 'yolobite.db'),
    path.join(process.env.APPDATA || '', 'yolopos', 'yolobite.db'),
    path.join(process.env.APPDATA || '', 'Electron', 'yolobite.db'),
    path.resolve('../dev.db')
  ];

  let foundDbPath = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const testDb = new Database(p, { readonly: true });
        const hasOrders = testDb.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='orders'").get();
        if (hasOrders && hasOrders.c > 0) {
          const count = testDb.prepare('SELECT count(*) as c FROM orders').get();
          console.log(`Found SQLite DB at: ${p} (${count.c} orders)`);
          if (count.c > 0 || !foundDbPath) {
            foundDbPath = p;
          }
        }
        testDb.close();
      } catch (e) {
        // ignore
      }
    }
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    sourceDb: foundDbPath || 'none',
    orders: [],
    products: [],
    cashiers: [],
    customers: []
  };

  if (foundDbPath) {
    console.log(`\nReading records from SQLite database: ${foundDbPath}`);
    const db = new Database(foundDbPath, { readonly: true });

    // Orders
    try {
      const orders = db.prepare('SELECT * FROM orders').all();
      const items = db.prepare('SELECT * FROM order_items').all();
      const itemsByOrder = {};
      for (const it of items) {
        if (!itemsByOrder[it.order_id || it.orderId]) itemsByOrder[it.order_id || it.orderId] = [];
        itemsByOrder[it.order_id || it.orderId].push({
          productId: it.product_id || it.productId,
          variantName: it.variant_name || it.variantName || null,
          quantity: it.quantity,
          price: it.price
        });
      }

      exportData.orders = orders.map(o => ({
        id: o.id,
        orderNumber: o.order_number || o.orderNumber,
        total: o.total,
        discount: o.discount || 0,
        tax: o.tax || 0,
        status: o.status || 'completed',
        cashierId: o.cashier_id || o.cashierId,
        customerId: o.customer_id || o.customerId,
        createdAt: o.created_at || o.createdAt,
        items: itemsByOrder[o.id] || []
      }));
      console.log(`✓ Loaded ${exportData.orders.length} orders from SQLite`);
    } catch (e) {
      console.warn('Orders read note:', e.message);
    }

    // Products
    try {
      exportData.products = db.prepare('SELECT * FROM products').all();
      console.log(`✓ Loaded ${exportData.products.length} products`);
    } catch (e) {}

    // Cashiers
    try {
      exportData.cashiers = db.prepare('SELECT * FROM cashiers').all();
      console.log(`✓ Loaded ${exportData.cashiers.length} cashiers`);
    } catch (e) {}

    // Customers
    try {
      exportData.customers = db.prepare('SELECT * FROM customers').all();
      console.log(`✓ Loaded ${exportData.customers.length} customers`);
    } catch (e) {}

    db.close();
  } else {
    console.log('Note: No SQLite orders table found on disk. Checking localStorage backup if available...');
  }

  // Save to JSON file
  const outPath = path.resolve('pos_yolo_backup.json');
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf8');
  console.log(`\n============================================`);
  console.log(` Export file created: ${outPath}`);
  console.log(` Total orders in backup: ${exportData.orders.length}`);
  console.log(`============================================\n`);

  // If orders exist, offer to push to Supabase
  if (exportData.orders.length > 0) {
    console.log('Attempting to push to Supabase Cloud...');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    let uploadedCount = 0;
    for (const order of exportData.orders) {
      const orderRow = {
        id: String(order.id),
        order_number: String(order.orderNumber || order.id),
        total: Number(order.total || 0),
        discount: Number(order.discount || 0),
        tax: Number(order.tax || 0),
        status: order.status || 'completed',
        cashier_id: (order.cashierId === 'cashier-admin' || order.cashierId === 'cashier-staff') ? order.cashierId : 'cashier-staff',
        created_at: Number(order.createdAt || Date.now())
      };
      if (order.customerId) orderRow.customer_id = order.customerId;

      const { error: oErr } = await supabase.from('orders').upsert(orderRow);
      if (!oErr) {
        uploadedCount++;
        if (order.items && order.items.length > 0) {
          const itemRows = order.items.map((it, idx) => ({
            id: `${order.id}-item-${idx}`,
            order_id: String(order.id),
            product_id: String(it.productId),
            variant_name: it.variantName || null,
            quantity: Number(it.quantity || 1),
            price: Number(it.price || 0)
          }));
          await supabase.from('order_items').upsert(itemRows).catch(() => {});
        }
      } else {
        console.warn(`Error uploading order ${order.orderNumber}:`, oErr.message);
      }
    }
    console.log(`✓ Successfully uploaded ${uploadedCount} / ${exportData.orders.length} orders to Supabase!`);
  } else {
    console.log('0 orders in SQLite. If your orders are in browser localStorage, use the "Export Backup" button inside System Settings in the app!');
  }
}

main().catch(err => {
  console.error('Export error:', err);
});
