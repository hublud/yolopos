import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Auth & Cashiers
  loginPin: (pin: string) => ipcRenderer.invoke('auth:login-pin', pin),
  getCashiers: () => ipcRenderer.invoke('db:cashiers:list'),
  updateCashierPin: (id: string, pin: string) => ipcRenderer.invoke('db:cashiers:update-pin', id, pin),
  addCashier: (data: any) => ipcRenderer.invoke('db:cashiers:add', data),
  
  // Products
  getProducts: () => ipcRenderer.invoke('db:products:list'),
  addProduct: (data: any) => ipcRenderer.invoke('db:products:add', data),
  updateProductStock: (data: any) => ipcRenderer.invoke('db:products:update-stock', data),
  updateProduct: (id: string, data: any) => ipcRenderer.invoke('db:products:update', id, data),
  
  // Orders
  createOrder: (payload: any) => ipcRenderer.invoke('db:orders:create', payload),
  getOrders: () => ipcRenderer.invoke('db:orders:list'),
  
  // Customers
  getCustomers: () => ipcRenderer.invoke('db:customers:list'),
  addCustomer: (data: any) => ipcRenderer.invoke('db:customers:add', data),
  
  // Dashboard
  getDashboardMetrics: () => ipcRenderer.invoke('db:dashboard:metrics'),
  
  // Printing
  printReceipt: () => ipcRenderer.invoke('receipt:print'),
  downloadReceiptPDF: () => ipcRenderer.invoke('receipt:download-pdf'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('db:settings:get'),
  saveSettings: (data: any) => ipcRenderer.invoke('db:settings:save', data)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
