import React, { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { POS } from './pages/POS'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Customers } from './pages/Customers'
import { Settings } from './pages/Settings'
import { syncManager } from './services/syncManager'
import { api } from './api'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
          <div className="bg-red-50 text-yolo-red p-4 rounded-2xl mb-4 border border-red-100 max-w-md">
            <h3 className="font-bold text-base mb-1">Notice</h3>
            <p className="text-xs text-red-600 mb-3">{this.state.error?.message || 'An issue occurred rendering this view.'}</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })} 
              className="bg-yolo-red text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition-all"
            >
              Retry View
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const [cashier, setCashier] = useState<any>(null)
  const [currentTab, setTab] = useState<string>('pos')
  const [products, setProducts] = useState<any[]>(() => syncManager.getCached<any[]>('products', []))
  const [loadingProducts, setLoadingProducts] = useState<boolean>(() => syncManager.getCached<any[]>('products', []).length === 0)
  const [settings, setSettings] = useState<any>(() => syncManager.getCached<any>('settings', {
    businessName: 'YOLO BITES',
    taxRate: 0.0,
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
      const data = await api.getProducts()
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
      const data = await api.getSettings()
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
      <ErrorBoundary>
        {currentTab === 'pos' && <POS cashier={cashier} products={products} settings={settings} loading={loadingProducts} />}
        {cashier?.role === 'admin' && currentTab === 'dashboard' && <Dashboard />}
        {cashier?.role === 'admin' && currentTab === 'inventory' && <Inventory products={products} loading={loadingProducts} onRefresh={loadProducts} />}
        {cashier?.role === 'admin' && currentTab === 'customers' && <Customers />}
        {cashier?.role === 'admin' && currentTab === 'settings' && <Settings settings={settings} onSettingsSaved={loadSettings} />}
      </ErrorBoundary>
    </Layout>
  )
}

export default App
