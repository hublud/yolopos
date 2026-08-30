import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://jfehfblygghjzwvgrjmk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1NDg1MSwiZXhwIjoyMTAzNjMwODUxfQ.FgbdmKPq2mUmO-NWlsZZLg-WJJXBE6u9-GZ1QiX1TM0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('=== Starting Supabase Migration ===');
  
  const backupPath = path.resolve('pos_yolo_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('pos_yolo_backup.json not found!');
    process.exit(1);
  }

  const rawBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  // 1. Migrate Cashiers
  const rawCashiers = JSON.parse(rawBackup.yolo_cashiers || '[]');
  console.log(`Migrating ${rawCashiers.length} cashiers...`);
  if (rawCashiers.length > 0) {
    const { error } = await supabase.from('cashiers').upsert(
      rawCashiers.map(c => ({
        id: c.id,
        name: c.name,
        pin: c.pin,
        role: c.role || 'cashier'
      }))
    );
    if (error) console.error('Error inserting cashiers:', error);
    else console.log('✓ Cashiers migrated successfully.');
  }

  // 2. Migrate Products
  const rawProducts = JSON.parse(rawBackup.yolo_products || '[]');
  console.log(`Migrating ${rawProducts.length} products...`);
  if (rawProducts.length > 0) {
    const { error } = await supabase.from('products').upsert(
      rawProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        image: p.image || 'drink.png',
        stock: p.stock || 0,
        created_at: p.createdAt || Date.now()
      }))
    );
    if (error) console.error('Error inserting products:', error);
    else console.log('✓ Products migrated successfully.');
  }

  // 3. Migrate Customers
  const rawCustomers = JSON.parse(rawBackup.yolo_customers || '[]');
  console.log(`Migrating ${rawCustomers.length} customers...`);
  if (rawCustomers.length > 0) {
    const { error } = await supabase.from('customers').upsert(
      rawCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        loyalty_points: c.loyalty_points || c.loyaltyPoints || 0
      }))
    );
    if (error) console.error('Error inserting customers:', error);
    else console.log('✓ Customers migrated successfully.');
  }

  // 4. Migrate Settings
  let rawSettings = rawBackup.yolo_settings;
  if (typeof rawSettings === 'string') {
    rawSettings = JSON.parse(rawSettings || '{}');
  }
  if (rawSettings && rawSettings.businessName) {
    console.log('Migrating settings...');
    const { error } = await supabase.from('settings').upsert({
      id: 1,
      business_name: rawSettings.businessName,
      tax_rate: rawSettings.taxRate ?? 10,
      receipt_address: rawSettings.receiptAddress || '',
      phones: rawSettings.phones || ''
    });
    if (error) console.error('Error inserting settings:', error);
    else console.log('✓ Settings migrated successfully.');
  }

  // 5. Migrate Inventory Logs
  const rawLogs = JSON.parse(rawBackup.yolo_inventory_logs || '[]');
  console.log(`Migrating ${rawLogs.length} inventory logs...`);
  if (rawLogs.length > 0) {
    // Only insert logs where product exists in rawProducts to avoid foreign key violations
    const validProductIds = new Set(rawProducts.map(p => p.id));
    const validLogs = rawLogs
      .filter(l => validProductIds.has(l.productId))
      .map(l => ({
        id: l.id,
        product_id: l.productId,
        change: l.change,
        reason: l.reason || 'restock',
        created_at: l.createdAt || Date.now()
      }));

    if (validLogs.length > 0) {
      // Chunk insertions by 100
      for (let i = 0; i < validLogs.length; i += 100) {
        const chunk = validLogs.slice(i, i + 100);
        const { error } = await supabase.from('inventory_logs').upsert(chunk);
        if (error) console.error('Error inserting logs chunk:', error);
      }
      console.log(`✓ ${validLogs.length} Inventory logs migrated.`);
    }
  }

  // 6. Migrate Orders & Order Items
  const rawOrders = JSON.parse(rawBackup.yolo_orders || '[]');
  console.log(`Migrating ${rawOrders.length} orders...`);
  if (rawOrders.length > 0) {
    for (const order of rawOrders) {
      const { error: orderErr } = await supabase.from('orders').upsert({
        id: order.id,
        order_number: order.orderNumber,
        total: order.total,
        discount: order.discount || 0,
        tax: order.tax || 0,
        status: order.status || 'completed',
        cashier_id: order.cashierId || null,
        customer_id: order.customerId || null,
        created_at: order.createdAt || Date.now()
      });
      if (orderErr) {
        console.error(`Error inserting order ${order.orderNumber}:`, orderErr);
        continue;
      }

      if (order.items && order.items.length > 0) {
        const orderItems = order.items.map((item, idx) => ({
          id: `${order.id}-item-${idx}`,
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        }));
        const { error: itemErr } = await supabase.from('order_items').upsert(orderItems);
        if (itemErr) console.error(`Error inserting order items for ${order.orderNumber}:`, itemErr);
      }
    }
    console.log('✓ Orders migrated successfully.');
  }

  console.log('=== Migration Complete! ===');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
});
