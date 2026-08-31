import { useState, useEffect } from 'react'
import { 
  Coins, 
  ShoppingBag, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Receipt, 
  X, 
  User, 
  Award,
  ArrowUpRight,
  ClipboardList,
  RefreshCw
} from 'lucide-react'
import logoSrc from '../assets/logo.jpeg'
import { syncManager } from '../services/syncManager'

interface OrderItem {
  productId: string
  name: string
  category: string
  variantName?: string
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  total: number
  discount: number
  tax: number
  status: string
  paymentMethod?: string
  cashierId: string
  cashierName: string
  customerId?: string
  customerName?: string
  createdAt: number
  items: OrderItem[]
}

export function Dashboard() {
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Date Filtering states - default to 'all' so all database transactions are shown
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'date' | 'month'>('all')
  
  // Default values for pickers (local timezone)
  const getTodayString = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const getMonthString = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthString())
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  
  // Business settings fallback
  const [settings, setSettings] = useState(() => syncManager.getCached<any>('settings', {
    businessName: 'YOLO BITES',
    receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
    phones: '07013974928, 07044030444'
  }))

  useEffect(() => {
    loadData()

    // 1. Subscribe to real-time events across all devices
    const unsubscribe = syncManager.subscribe(() => {
      loadData(false)
    })

    // 2. Continuous real-time cloud polling every 5 seconds
    const interval = setInterval(() => {
      loadData(false)
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadData = async (showLoading = true) => {
    if (showLoading && allOrders.length === 0 && products.length === 0) {
      setLoading(true)
    }
    try {
      const [ordersData, productsData, settingsData] = await Promise.all([
        // @ts-ignore
        window.api.getOrders(),
        // @ts-ignore
        window.api.getProducts(),
        // @ts-ignore
        window.api.getSettings()
      ])
      if (ordersData && Array.isArray(ordersData)) setAllOrders(ordersData)
      if (productsData && Array.isArray(productsData)) setProducts(productsData)
      if (settingsData) setSettings(settingsData)
    } catch (e) {
      console.error('Failed to load dashboard data:', e)
    } finally {
      if (showLoading) setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadData(false)
  }

  // Get local date string YYYY-MM-DD from timestamp
  const getLocalDateString = (timestamp: any) => {
    if (!timestamp) return getTodayString()
    const num = Number(timestamp)
    const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(timestamp)
    if (isNaN(d.getTime())) return getTodayString()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Filter orders based on selected mode
  const filteredOrders = allOrders.filter(order => {
    if (!order) return false
    const rawTime = order.createdAt
    const timeMs = typeof rawTime === 'number' ? rawTime : Number(rawTime) || Date.now()
    const orderDateStr = getLocalDateString(timeMs) // YYYY-MM-DD
    const orderMonthStr = orderDateStr.substring(0, 7) // YYYY-MM

    if (filterMode === 'all') {
      return true
    } else if (filterMode === 'today') {
      const isWithinLast24Hours = (Date.now() - timeMs) >= 0 && (Date.now() - timeMs) <= (24 * 60 * 60 * 1000)
      return orderDateStr === getTodayString() || isWithinLast24Hours
    } else if (filterMode === 'date') {
      return orderDateStr === selectedDate
    } else if (filterMode === 'month') {
      return orderMonthStr === selectedMonth
    }
    return true
  })

  // Search orders
  const searchedOrders = filteredOrders.filter(order => {
    if (!order) return false
    const query = String(searchQuery || '').toLowerCase().trim()
    if (!query) return true
    const orderNum = String(order.orderNumber || order.id || '').toLowerCase()
    const cashierName = String(order.cashierName || '').toLowerCase()
    const customerName = String(order.customerName || '').toLowerCase()
    return orderNum.includes(query) || cashierName.includes(query) || customerName.includes(query)
  })

  // Calculate Metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0)
  const totalOrdersCount = filteredOrders.length
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0
  const lowStockAlertsCount = products.filter(p => Number(p?.stock || 0) <= 5).length

  // Calculate Top Selling Items
  const itemSalesMap: { [productId: string]: { name: string; category: string; quantity: number; revenue: number } } = {}
  filteredOrders.forEach(order => {
    if (order && order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (!item) return
        const pId = String(item.productId || item.name || 'item')
        if (!itemSalesMap[pId]) {
          itemSalesMap[pId] = {
            name: item.name || 'Item',
            category: item.category || 'Mains',
            quantity: 0,
            revenue: 0
          }
        }
        const qty = Number(item.quantity || 1)
        const pr = Number(item.price || 0)
        itemSalesMap[pId].quantity += qty
        itemSalesMap[pId].revenue += qty * pr
      })
    }
  })

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const maxQuantitySold = topSellingItems.length > 0 ? topSellingItems[0].quantity : 1

  // Format Helper
  const formatCurrency = (val: any) => {
    const num = Number(val || 0)
    return '₦' + (isNaN(num) ? '0.00' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const num = Number(timestamp)
    const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(timestamp)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const num = Number(timestamp)
    const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(timestamp)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getCategoryEmoji = (category?: string) => {
    const cat = String(category || '').toLowerCase()
    if (cat.includes('mocktail')) return '🍹'
    if (cat.includes('cocktail')) return '🍸'
    if (cat.includes('smoothie')) return '🥤'
    if (cat.includes('milkshake') || cat.includes('shake')) return '🥛'
    if (cat.includes('juice')) return '🧃'
    if (cat.includes('burger')) return '🍔'
    if (cat.includes('pizza')) return '🍕'
    if (cat.includes('shawarma')) return '🌯'
    if (cat.includes('chop')) return '🍗'
    return '🥤'
  }

  if (loading && allOrders.length === 0) {
    return (
      <div className="p-6 md:p-8 h-full w-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar bg-gray-50/50">
        <div className="my-auto py-6 w-full max-w-4xl flex flex-col items-center">
          
          {/* Centered Branded Spinner */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center p-2.5 relative overflow-hidden z-10">
              <img src={logoSrc} alt="YOLO BITES" className="w-full h-full object-contain rounded-xl animate-pulse" />
            </div>
            <div className="absolute -inset-2.5 rounded-[26px] border-2 border-dashed border-yolo-red animate-spin pointer-events-none" />
          </div>

          <div className="text-center mb-8">
            <h3 className="text-base font-bold text-yolo-dark tracking-tight">Loading Analytics & Transactions...</h3>
            <p className="text-xs text-gray-400 mt-1">Connecting to cloud and calculating sales metrics</p>
          </div>

          {/* Skeleton Stat Cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse flex items-center justify-between">
                <div className="flex-1 mr-2">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-28" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              </div>
            ))}
          </div>

          {/* Skeleton Table */}
          <div className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse flex flex-col gap-3">
            <div className="h-4 bg-gray-200 rounded w-36 mb-1" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-50 rounded-xl w-full" />
            ))}
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-gray-50">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-yolo-dark">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor sales metrics, transaction histories, and beverage popularity.</p>
        </div>

        {/* Date Filter Controls & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-gray-50 border border-gray-100 shadow-sm px-3.5 py-2 rounded-2xl text-gray-600 hover:text-yolo-dark active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Fetch Latest Real-time Transactions from Cloud"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-yolo-red' : 'text-yolo-red'} />
            <span>Live Refresh</span>
          </button>

          <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterMode('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'today' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'all' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setFilterMode('date')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'date' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                Specific Date
              </button>
              <button
                onClick={() => setFilterMode('month')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'month' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Conditional Picker Fields */}
            {filterMode === 'date' && (
              <div className="flex items-center gap-2 pl-2">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold border-0 focus:ring-0 text-gray-700 bg-transparent p-0 cursor-pointer outline-none"
                />
              </div>
            )}

            {filterMode === 'month' && (
              <div className="flex items-center gap-2 pl-2">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-semibold border-0 focus:ring-0 text-gray-700 bg-transparent p-0 cursor-pointer outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Metric 1: Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
              {filterMode === 'today' ? "Today's Revenue" : filterMode === 'date' ? "Date's Revenue" : "Monthly Revenue"}
            </p>
            <h3 className="text-2xl font-black text-yolo-dark">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Coins size={24} />
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Sales Orders</p>
            <h3 className="text-2xl font-black text-yolo-dark">{totalOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Metric 3: Average Order Value */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Average Order Value</p>
            <h3 className="text-2xl font-black text-yolo-dark">{formatCurrency(averageOrderValue)}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shadow-inner">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Metric 4: Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-yolo-dark">{lowStockAlertsCount}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 text-yolo-red rounded-2xl flex items-center justify-center shadow-inner">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Main content split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Recent Activity (Order Feed) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[450px] lg:col-span-3 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-yolo-dark">Recent Transactions</h3>
              <p className="text-xs text-gray-500">Showing {searchedOrders.length} records matching current filter</p>
            </div>
            
            {/* Search orders */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search order, cashier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 text-xs bg-gray-50 pl-8 pr-4 py-2 rounded-xl border border-gray-100 focus:outline-none focus:border-yolo-red focus:bg-white transition-all text-gray-700"
              />
              <Search size={14} className="text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* List/Table of Orders */}
          <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar">
            {searchedOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <ClipboardList size={40} strokeWidth={1.5} className="mb-2" />
                <p className="text-sm font-medium">No sales orders found.</p>
                <p className="text-xs">Checkout items at POS to view records here.</p>
              </div>
            ) : (
              <div className="w-full text-left border-collapse">
                <div className="grid grid-cols-12 border-b border-gray-100 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">Order Number</div>
                  <div className="col-span-3">Date / Time</div>
                  <div className="col-span-3">Cashier</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                <div className="divide-y divide-gray-50">
                  {searchedOrders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => setActiveOrder(order)}
                      className="grid grid-cols-12 py-3 items-center text-xs text-gray-600 hover:bg-red-50/60 hover:text-yolo-dark cursor-pointer rounded-xl px-2 transition-all active:scale-[0.99] group"
                    >
                      <div className="col-span-3 font-bold text-yolo-dark group-hover:text-yolo-red transition-colors flex items-center gap-1.5">
                        <Receipt size={13} className="text-gray-400 group-hover:text-yolo-red" />
                        #{order.orderNumber}
                      </div>
                      <div className="col-span-3">
                        <span className="font-medium text-gray-700 block">{formatDate(order.createdAt)}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{formatTime(order.createdAt)}</span>
                      </div>
                      <div className="col-span-3 font-medium text-gray-700">
                        {order.cashierName || 'Staff'}
                      </div>
                      <div className="col-span-2 text-right font-bold text-yolo-dark">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="p-1.5 inline-block group-hover:bg-red-100/70 text-gray-400 group-hover:text-yolo-red rounded-lg transition-all">
                          <Receipt size={14} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side: Top Selling Items Leaderboard */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[450px] lg:col-span-2 flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-yolo-dark">Top Selling Items</h3>
            <p className="text-xs text-gray-500">Popular drinks by quantity sold</p>
          </div>

          <div className="flex-1 flex flex-col gap-5 justify-start">
            {topSellingItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Award size={40} strokeWidth={1.5} className="mb-2" />
                <p className="text-sm font-medium">No sales data available yet.</p>
                <p className="text-xs">Popularity stats update automatically.</p>
              </div>
            ) : (
              topSellingItems.map((item, idx) => {
                const percentage = (item.quantity / maxQuantitySold) * 100;
                return (
                  <div key={idx} className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getCategoryEmoji(item.category)}</span>
                        <div>
                          <span className="text-xs font-bold text-yolo-dark block max-w-[140px] truncate">
                            {item.name}
                          </span>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                            {item.category || 'Beverage'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-yolo-dark block">
                          {item.quantity} sold
                        </span>
                        <span className="text-[10px] text-green-600 font-bold">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yolo-red h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* --- RECEIPT DETAILS MODAL --- */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-scaleUp">
            
            {/* Modal header */}
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-yolo-red" />
                <span className="font-bold text-sm text-yolo-dark">Order #{activeOrder.orderNumber}</span>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-yolo-dark rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[480px] custom-scrollbar flex-1 receipt-to-print">
              
              {/* Brand Header */}
              <div className="text-center mb-6">
                <h4 className="text-xl font-black text-yolo-red tracking-tight">{settings.businessName}</h4>
                <p className="text-[9px] text-gray-500 whitespace-pre-line mt-1 line-clamp-3">
                  {settings.receiptAddress}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">Phones: {settings.phones}</p>
              </div>

              {/* Order Meta details */}
              <div className="border-t border-b border-dashed border-gray-200 py-3 mb-4 text-[11px] text-gray-600 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-semibold text-yolo-dark">
                    {formatDate(activeOrder.createdAt)} @ {formatTime(activeOrder.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier Name:</span>
                  <span className="font-semibold text-yolo-dark">{activeOrder.cashierName || 'Staff'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-red-50 text-yolo-red border border-red-100">
                    {activeOrder.paymentMethod ? (activeOrder.paymentMethod === 'cash' ? '💵 Cash' : activeOrder.paymentMethod === 'pos' ? '💳 POS / Card' : '📱 Transfer') : '💵 Cash'}
                  </span>
                </div>
                {activeOrder.customerName && (
                  <div className="flex justify-between items-center text-yolo-red">
                    <span className="flex items-center gap-1">
                      <User size={10} /> Customer:
                    </span>
                    <span className="font-bold">{activeOrder.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Products Purchased</span>
                {activeOrder.items && activeOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start text-xs">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-yolo-dark flex items-center flex-wrap gap-1">
                        <span>{getCategoryEmoji(item.category)}</span>
                        <span>{item.name}</span>
                        {item.variantName && (
                          <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {item.variantName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {item.quantity} x {formatCurrency(item.price)}
                      </div>
                    </div>
                    <span className="font-bold text-yolo-dark mt-1">
                      {formatCurrency(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Calculations */}
              <div className="border-t border-dashed border-gray-200 pt-4 flex flex-col gap-2 text-xs text-gray-600">
                
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(activeOrder.total + activeOrder.discount - activeOrder.tax)}
                  </span>
                </div>

                {/* Tax */}
                {activeOrder.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-medium text-gray-700">+{formatCurrency(activeOrder.tax)}</span>
                  </div>
                )}

                {/* Discount */}
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount Applied</span>
                    <span>-{formatCurrency(activeOrder.discount)}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3 mt-1">
                  <span className="font-bold text-sm text-yolo-dark">Grand Total</span>
                  <span className="font-black text-lg text-yolo-red">
                    {formatCurrency(activeOrder.total)}
                  </span>
                </div>
              </div>

              {/* Dashed Receipt Footer cut */}
              <div className="mt-8 text-center text-[10px] text-gray-400">
                <p>Thank you for your patronage!</p>
                <div className="w-full border-b border-dashed border-gray-200 my-4"></div>
                <p className="text-[8px] uppercase tracking-widest font-mono text-gray-300">
                  SYSTEM LOG TRANSACTION
                </p>
              </div>

            </div>

            {/* Print action inside modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  window.print()
                }}
                className="flex-1 bg-yolo-red hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-red-200 hover:shadow-lg transition-all"
              >
                Print Copy
              </button>
              <button
                onClick={() => setActiveOrder(null)}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-500 border border-gray-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
