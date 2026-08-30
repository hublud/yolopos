import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { POS } from './pages/POS'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Customers } from './pages/Customers'
import { Settings } from './pages/Settings'

import { syncManager } from './services/syncManager'

function App() {
  const [cashier, setCashier] = useState<any>(null)
  const [currentTab, setTab] = useState<string>('pos')
  const [products, setProducts] = useState<any[]>(() => syncManager.getCached<any[]>('products', []))
  const [loadingProducts, setLoadingProducts] = useState<boolean>(() => syncManager.getCached<any[]>('products', []).length === 0)
  const [settings, setSettings] = useState<any>(() => syncManager.getCached<any>('settings', {
    businessName: 'YOLO BITES',
    taxRate: 10.0,
    receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
    phones: '07013974928, 07044030444'
  }))

  // Initial data load and real-time sync subscription
  useEffect(() => {
    if (!cashier) return
    loadProducts()
    loadSettings()
    if (cashier.role !== 'admin') {
      setTab('pos')
    }

    const unsubscribe = syncManager.subscribe(() => {
      loadProducts()
      loadSettings()
    })

    return () => unsubscribe()
  }, [cashier])

  const loadProducts = async () => {
    try {
      // @ts-ignore
      const data = await window.api.getProducts()
      if (data && Array.isArray(data)) {
        setProducts(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadSettings = async () => {
    try {
      // @ts-ignore
      const data = await window.api.getSettings()
      if (data) setSettings(data)
    } catch (e) {
      console.error(e)
    }
  }

  if (!cashier) {
    return <Login onLogin={setCashier} />
  }

  return (
    <Layout 
      currentTab={currentTab} 
      setTab={setTab} 
      cashier={cashier} 
      onLogout={() => setCashier(null)}
    >
      {currentTab === 'pos' && <POS cashier={cashier} products={products} settings={settings} loading={loadingProducts} />}
      {cashier?.role === 'admin' && currentTab === 'dashboard' && <Dashboard />}
      {cashier?.role === 'admin' && currentTab === 'inventory' && <Inventory />}
      {cashier?.role === 'admin' && currentTab === 'customers' && <Customers />}
      {cashier?.role === 'admin' && currentTab === 'settings' && <Settings settings={settings} onSettingsSaved={loadSettings} />}
    </Layout>
  )
}

export default App
