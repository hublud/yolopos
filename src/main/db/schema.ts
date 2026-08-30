import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const cashiers = sqliteTable('cashiers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  role: text('role').notNull().default('cashier'), // 'admin' or 'cashier'
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull(),
  image: text('image').notNull(),
  stock: integer('stock').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  total: real('total').notNull(),
  discount: real('discount').notNull().default(0),
  tax: real('tax').notNull().default(0),
  status: text('status').notNull().default('completed'),
  cashierId: text('cashier_id').references(() => cashiers.id),
  customerId: text('customer_id').references(() => customers.id),
  createdAt: integer('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});

export const inventoryLogs = sqliteTable('inventory_logs', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  change: integer('change').notNull(),
  reason: text('reason').notNull(), // 'sale', 'restock', 'spoilage'
  createdAt: integer('created_at').notNull(),
});

// Relations
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  cashier: one(cashiers, {
    fields: [orders.cashierId],
    references: [cashiers.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  businessName: text('business_name').notNull(),
  taxRate: real('tax_rate').notNull(),
  receiptAddress: text('receipt_address').notNull(),
  phones: text('phones').notNull(),
});

