import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      loginPin: (pin: string) => Promise<any>,
      getCashiers: () => Promise<any[]>,
      updateCashierPin: (id: string, pin: string) => Promise<{ success: boolean, error?: string }>,
      addCashier: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>,
      getProducts: () => Promise<any[]>,
      addProduct: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>,
      updateProductStock: (data: any) => Promise<{ success: boolean, error?: string }>,
      updateProduct: (id: string, data: any) => Promise<{ success: boolean, error?: string }>,
      createOrder: (payload: any) => Promise<{ success: boolean, orderId?: string, orderNumber?: string, error?: string }>,
      getOrders: () => Promise<any[]>,
      getCustomers: () => Promise<any[]>,
      addCustomer: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>,
      getDashboardMetrics: () => Promise<{ todayRevenue: number, todayOrders: number, lowStockAlerts: number }>,
      printReceipt: () => Promise<any>,
      downloadReceiptPDF: () => Promise<any>,
      getSettings: () => Promise<any>,
      saveSettings: (data: any) => Promise<{ success: boolean, error?: string }>
    }
  }
}
