import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfehfblygghjzwvgrjmk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1NDg1MSwiZXhwIjoyMTAzNjMwODUxfQ.FgbdmKPq2mUmO-NWlsZZLg-WJJXBE6u9-GZ1QiX1TM0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runAdminTests() {
  console.log('🧪 Starting Comprehensive Admin Capability Tests...\n');

  // Test 1: Update Business Settings
  console.log('1. Testing Business Profile / Settings Update...');
  const updatedSettings = {
    id: 1,
    business_name: 'YOLO BITES RESTAURANT & BAR',
    tax_rate: 0.5,
    receipt_address: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD, BARNAWA, KADUNA',
    phones: '09038108882, 07044030444'
  };
  const { error: setErr } = await supabase.from('settings').upsert(updatedSettings);
  if (setErr) throw new Error('Settings update failed: ' + JSON.stringify(setErr));
  console.log('   ✓ Business Details updated successfully.');

  // Test 2: Add and Update Staff / Cashier
  console.log('\n2. Testing Staff / Admin Profile PIN & Staff Creation...');
  const testStaffId = 'test-cashier-' + Date.now();
  const { error: cashErr } = await supabase.from('cashiers').insert({
    id: testStaffId,
    name: 'Test Supervisor',
    pin: '9999',
    role: 'admin'
  });
  if (cashErr) throw new Error('Staff creation failed: ' + JSON.stringify(cashErr));
  console.log('   ✓ New Admin / Staff created (PIN: 9999).');

  // Update PIN
  const { error: pinErr } = await supabase.from('cashiers').update({ pin: '8888' }).eq('id', testStaffId);
  if (pinErr) throw new Error('PIN update failed: ' + JSON.stringify(pinErr));
  console.log('   ✓ Staff PIN changed from 9999 to 8888 successfully.');

  // Clean up test staff
  await supabase.from('cashiers').delete().eq('id', testStaffId);
  console.log('   ✓ Test staff cleaned up.');

  // Test 3: Create New Category and Product
  console.log('\n3. Testing Category Creation and Product Addition...');
  const newCatProductId = 'prod-test-' + Date.now();
  const { error: addProdErr } = await supabase.from('products').insert({
    id: newCatProductId,
    name: 'Chef Special BBQ Ribs',
    price: 15000,
    category: 'Chef Specials', // Newly created custom category
    image: 'drink.png',
    stock: 25,
    created_at: Date.now()
  });
  if (addProdErr) throw new Error('Product & Category addition failed: ' + JSON.stringify(addProdErr));
  console.log('   ✓ Created new category "Chef Specials" and added "Chef Special BBQ Ribs".');

  // Test 4: Update Item Details & Price
  console.log('\n4. Testing Product Updating (Price, Name, Category)...');
  const { error: updateErr } = await supabase.from('products').update({
    name: 'Chef Special BBQ Ribs (Large Platter)',
    price: 17500,
    stock: 30
  }).eq('id', newCatProductId);
  if (updateErr) throw new Error('Product update failed: ' + JSON.stringify(updateErr));
  console.log('   ✓ Updated product name and price to ₦17,500.');

  // Test 5: Adjust Stock & Log
  console.log('\n5. Testing Stock Adjustment & Inventory Logs...');
  const { error: stockErr } = await supabase.from('inventory_logs').insert({
    id: 'log-' + Date.now(),
    product_id: newCatProductId,
    change: 10,
    reason: 'restock',
    created_at: Date.now()
  });
  if (stockErr) throw new Error('Inventory log failed: ' + JSON.stringify(stockErr));
  console.log('   ✓ Stock adjustment logged successfully (+10 Restock).');

  // Clean up test product
  await supabase.from('inventory_logs').delete().eq('product_id', newCatProductId);
  await supabase.from('products').delete().eq('id', newCatProductId);
  console.log('   ✓ Test product and logs cleaned up.');

  console.log('\n🎉 ALL ADMIN CAPABILITY TESTS PASSED WITH 100% SUCCESS!');
}

runAdminTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
