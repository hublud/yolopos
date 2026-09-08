import { ipcMain, BrowserWindow, dialog } from 'electron';
import { db } from './db';
import { eq, sql } from 'drizzle-orm';
import { cashiers, products, orders, orderItems, inventoryLogs, customers, settings, offlineQueue } from './db/schema';
import { randomUUID } from 'crypto';
import fs from 'fs';

export function registerIpcHandlers() {
  // ── Auth & Cashiers ──────────────────────────────────────────────────────────
  ipcMain.handle('auth:login-pin', async (_, pin: string) => {
    const user = await db.select().from(cashiers).where(eq(cashiers.pin, pin)).limit(1);
    return user.length > 0 ? user[0] : null;
  });

  ipcMain.handle('db:cashiers:list', async () => {
    return await db.select().from(cashiers);
  });

  ipcMain.handle('db:cashiers:update-pin', async (_, id: string, pin: string) => {
    try {
      await db.update(cashiers).set({ pin }).where(eq(cashiers.id, id));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:cashiers:add', async (_, data: { name: string, pin: string, role: string }) => {
    try {
      const id = randomUUID();
      await db.insert(cashiers).values({ id, ...data });
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── Products ─────────────────────────────────────────────────────────────────
  ipcMain.handle('db:products:list', async () => {
    const rows = await db.select().from(products);
    return rows.map(p => ({
      ...p,
      variants: typeof p.variants === 'string' ? JSON.parse(p.variants as string || '[]') : (p.variants || [])
    }));
  });

  ipcMain.handle('db:products:add', async (_, data: {
    name: string, price: number, category: string, image: string, stock: number, variants?: any[]
  }) => {
    try {
      const id = randomUUID();
      const now = Date.now();
      await db.insert(products).values({
        id,
        name: data.name,
        price: Number(data.price),
        category: data.category,
        image: data.image || 'drink.png',
        stock: Number(data.stock || 0),
        variants: JSON.stringify(data.variants || []) as any,
        createdAt: now
      });
      
      await db.insert(inventoryLogs).values({
        id: randomUUID(),
        productId: id,
        change: data.stock,
        reason: 'initial',
        createdAt: now
      });
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:products:update-stock', async (_, data: { productId: string, change: number, reason: string }) => {
    try {
      await db.run(sql`UPDATE products SET stock = stock + ${data.change} WHERE id = ${data.productId}`);
      await db.insert(inventoryLogs).values({
        id: randomUUID(),
        productId: data.productId,
        change: data.change,
        reason: data.reason,
        createdAt: Date.now()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:products:update', async (_, id: string, data: {
    name: string, price: number, category: string, image: string, variants?: any[]
  }) => {
    try {
      await db.update(products).set({
        name: data.name,
        price: Number(data.price),
        category: data.category,
        image: data.image,
        variants: JSON.stringify(data.variants || []) as any
      }).where(eq(products.id, id));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── Orders & Checkout ────────────────────────────────────────────────────────
  ipcMain.handle('db:orders:create', async (_, payload: { 
    cashierId: string, 
    customerId?: string,
    paymentMethod?: string,
    items: { productId: string, variantName?: string, name?: string, quantity: number, price: number }[],
    total: number,
    discount: number,
    tax: number
  }) => {
    try {
      return await db.transaction(async (tx) => {
        const orderId = randomUUID();
        const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
        
        await tx.insert(orders).values({
          id: orderId,
          orderNumber,
          total: payload.total,
          discount: payload.discount,
          tax: payload.tax,
          paymentMethod: payload.paymentMethod || 'cash',
          cashierId: payload.cashierId,
          customerId: payload.customerId,
          createdAt: Date.now()
        });

        for (const item of payload.items) {
          await tx.insert(orderItems).values({
            id: randomUUID(),
            orderId,
            productId: item.productId,
            variantName: item.variantName || null,
            quantity: item.quantity,
            price: item.price
          });

          // Only reduce stock if product exists in local DB
          await tx.run(sql`UPDATE products SET stock = MAX(0, stock - ${item.quantity}) WHERE id = ${item.productId}`);
          
          const exists = tx.run(sql`SELECT id FROM products WHERE id = ${item.productId}`);
          if (exists) {
            await tx.insert(inventoryLogs).values({
              id: randomUUID(),
              productId: item.productId,
              change: -item.quantity,
              reason: 'sale',
              createdAt: Date.now()
            }).catch(() => {}); // Non-fatal if product not in local DB
          }
        }

        if (payload.customerId) {
          const pointsEarned = Math.floor(payload.total / 10);
          await tx.run(sql`UPDATE customers SET loyalty_points = loyalty_points + ${pointsEarned} WHERE id = ${payload.customerId}`);
        }

        return { success: true, orderId, orderNumber };
      });
    } catch (error) {
      console.error("Local order save failed:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:orders:list', async () => {
    try {
      const ordersList = await db.select().from(orders);
      const fullOrders: any[] = [];
      for (const order of ordersList) {
        let cashierName = 'Unknown';
        if (order.cashierId) {
          const cash = await db.select().from(cashiers).where(eq(cashiers.id, order.cashierId)).limit(1);
          if (cash.length > 0) cashierName = cash[0].name;
        }
        
        let customerName = '';
        if (order.customerId) {
          const cust = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
          if (cust.length > 0) customerName = cust[0].name;
        }

        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const detailedItems = items.map(item => ({
          productId: item.productId,
          variantName: item.variantName || '',
          quantity: item.quantity,
          price: item.price
        }));

        fullOrders.push({
          ...order,
          cashierName,
          customerName,
          items: detailedItems
        });
      }
      return fullOrders.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Failed to list orders:", error);
      return [];
    }
  });

  // ── Offline Queue (Durable Cloud Sync Queue) ─────────────────────────────────
  // Used by the renderer's syncManager as a persistent store instead of localStorage

  ipcMain.handle('db:queue:push', async (_, item: {
    id: string, type: string, payload: any, timestamp: number
  }) => {
    try {
      await db.insert(offlineQueue).values({
        id: item.id,
        type: item.type,
        payload: typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload),
        timestamp: item.timestamp,
        retries: 0
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:queue:get-pending', async () => {
    try {
      const rows = await db.select().from(offlineQueue);
      return rows.map(r => ({
        id: r.id,
        type: r.type,
        payload: JSON.parse(r.payload),
        timestamp: r.timestamp,
        retries: r.retries
      }));
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  });

  ipcMain.handle('db:queue:remove', async (_, ids: string[]) => {
    try {
      for (const id of ids) {
        await db.delete(offlineQueue).where(eq(offlineQueue.id, id));
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:queue:increment-retries', async (_, id: string) => {
    try {
      await db.run(sql`UPDATE offline_queue SET retries = retries + 1 WHERE id = ${id}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── Customers ────────────────────────────────────────────────────────────────
  ipcMain.handle('db:customers:list', async () => {
    return await db.select().from(customers);
  });

  ipcMain.handle('db:customers:add', async (_, data: { name: string, phone: string }) => {
    try {
      const id = randomUUID();
      await db.insert(customers).values({ id, ...data });
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── Dashboard Metrics ────────────────────────────────────────────────────────
  ipcMain.handle('db:dashboard:metrics', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    const revenueResult = await db.select({ total: sql<number>`SUM(total)` }).from(orders).where(sql`created_at >= ${startOfDay}`);
    const todayRevenue = revenueResult[0]?.total || 0;

    const ordersResult = await db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(sql`created_at >= ${startOfDay}`);
    const todayOrders = ordersResult[0]?.count || 0;

    const lowStockResult = await db.select({ count: sql<number>`COUNT(*)` }).from(products).where(sql`stock <= 5`);
    const lowStockAlerts = lowStockResult[0]?.count || 0;

    const pendingSync = await db.select({ count: sql<number>`COUNT(*)` }).from(offlineQueue);
    const pendingCount = pendingSync[0]?.count || 0;

    return { todayRevenue, todayOrders, lowStockAlerts, pendingCount };
  });

  // ── Printing & PDF ───────────────────────────────────────────────────────────
  ipcMain.handle('receipt:print', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No active window' };
    win.webContents.print({ silent: false, printBackground: true });
    return { success: true };
  });

  ipcMain.handle('receipt:download-pdf', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No active window' };
    
    try {
      const data = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true
      });
      
      const { filePath } = await dialog.showSaveDialog(win, {
        title: 'Save Receipt PDF',
        defaultPath: `receipt-${Date.now()}.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });
      
      if (filePath) {
        fs.writeFileSync(filePath, data);
        return { success: true, filePath };
      }
      return { success: false, error: 'Save cancelled' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── Settings ─────────────────────────────────────────────────────────────────
  ipcMain.handle('db:settings:get', async () => {
    try {
      const results = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
      if (results.length > 0) return results[0];
      return {
        id: 1,
        businessName: 'YOLO BITES',
        taxRate: 0.0,
        receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
        phones: '07013974928, 07044030444'
      };
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      return {
        id: 1,
        businessName: 'YOLO BITES',
        taxRate: 0.0,
        receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
        phones: '07013974928, 07044030444'
      };
    }
  });

  ipcMain.handle('db:settings:save', async (_, data: { businessName: string, taxRate: number, receiptAddress: string, phones: string }) => {
    try {
      await db.insert(settings).values({
        id: 1,
        businessName: data.businessName,
        taxRate: Number(data.taxRate),
        receiptAddress: data.receiptAddress,
        phones: data.phones
      }).onConflictDoUpdate({
        target: settings.id,
        set: {
          businessName: data.businessName,
          taxRate: Number(data.taxRate),
          receiptAddress: data.receiptAddress,
          phones: data.phones
        }
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to save settings:", error);
      return { success: false, error: (error as Error).message };
    }
  });
}
