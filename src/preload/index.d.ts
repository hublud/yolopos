import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Auth & Cashiers
      loginPin: (pin: string) => Promise<any>,
      getCashiers: () => Promise<any[]>,
      updateCashierPin: (id: string, pin: string) => Promise<{ success: boolean, error?: string }>,
      addCashier: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>,
      // Products
      getProducts: () => Promise<any[]>,
      addProduct: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>,
      updateProductStock: (data: any) => Promise<{ success: boolean, error?: string }>,
      updateProduct: (id: string, data: any) => Promise<{ success: boolean, error?: string }>,
      // Orders
      createOrder: (payload: any) => Promise<{ success: boolean, orderId?: string, orderNumber?: string, error?: string }>,
      getOrders: () => Promise<any[]>,
      // Offline Queue
      pushToQueue: (item: { id: string, type: string, payload: any, timestamp: number }) => Promise<{ success: boolean, error?: string }>,
      getPendingQueue: () => Promise<{ id: string, type: string, payload: any, timestamp: number, retries: number }[]>,
      removeFromQueue: (ids: string[]) => Promise<{ success: boolean, error?: string }>,
      incrementQueueRetries: (id: string) => Promise<{ success: boolean, error?: string }>,
      // Customers
      getCustomers: () => Promise<any[]>,
      addCustomer: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>,
      // Dashboard
      getDashboardMetrics: () => Promise<{ todayRevenue: number, todayOrders: number, lowStockAlerts: number, pendingCount?: number }>,
      // Printing
      printReceipt: () => Promise<any>,
      downloadReceiptPDF: () => Promise<any>,
      // Settings
      getSettings: () => Promise<any>,
      saveSettings: (data: any) => Promise<{ success: boolean, error?: string }>
    }
  }
}
