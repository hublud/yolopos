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
  RefreshCw,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  FileDown,
  FileText
} from 'lucide-react'
import logoSrc from '../assets/logo.jpeg'
import { syncManager } from '../services/syncManager'
import { api } from '../api'
import { generatePdfReport } from '../utils/pdfReportGenerator'

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

  // Super Admin Order Deletion State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccessToast, setDeleteSuccessToast] = useState('')

  const SUPER_ADMIN_PASSWORD = 'Del@123#'
  
  // Business settings fallback
  const [settings, setSettings] = useState(() => syncManager.getCached<any>('settings', {
    businessName: 'YOLO BITES',
    receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
    phones: '07013974928, 07044030444'
  }))

  const handleRequestDelete = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation()
    setOrderToDelete(order)
    setAdminPassword('')
    setPasswordError('')
    setShowPassword(false)
  }

  const handleConfirmDelete = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!orderToDelete) return

    if (adminPassword !== SUPER_ADMIN_PASSWORD) {
      setPasswordError('Incorrect Super Admin password. Please try again.')
      return
    }

    setIsDeleting(true)
    setPasswordError('')

    try {
      const res = await api.deleteOrder(orderToDelete.id)
      if (res.success) {
        setDeleteSuccessToast(`Order #${orderToDelete.orderNumber} deleted successfully.`)
        setTimeout(() => setDeleteSuccessToast(''), 4000)
        setOrderToDelete(null)
        setAdminPassword('')
        setShowPassword(false)
        await loadData(false)
      } else {
        setPasswordError(res.error || 'Failed to delete order.')
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error occurred while deleting order.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseDeleteModal = () => {
    if (isDeleting) return
    setOrderToDelete(null)
    setAdminPassword('')
    setPasswordError('')
    setShowPassword(false)
  }

  // PDF Report Modal State
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<'today' | 'monthly' | 'yearly' | 'custom' | 'all'>('today')
  const [reportMonth, setReportMonth] = useState<string>(getMonthString()) // YYYY-MM
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString())
  const [reportStartDate, setReportStartDate] = useState<string>(getTodayString())
  const [reportEndDate, setReportEndDate] = useState<string>(getTodayString())
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Filter orders for PDF generation
  const getReportOrders = () => {
    return allOrders.filter(order => {
      if (!order) return false
      const rawTime = order.createdAt
      const timeMs = typeof rawTime === 'number' ? rawTime : Number(rawTime) || Date.now()
      const orderDateStr = getLocalDateString(timeMs) // YYYY-MM-DD
      const orderMonthStr = orderDateStr.substring(0, 7) // YYYY-MM
      const orderYearStr = orderDateStr.substring(0, 4) // YYYY

      if (reportType === 'today') {
        const isWithinLast24Hours = (Date.now() - timeMs) >= 0 && (Date.now() - timeMs) <= (24 * 60 * 60 * 1000)
        return orderDateStr === getTodayString() || isWithinLast24Hours
      } else if (reportType === 'monthly') {
        return orderMonthStr === reportMonth
      } else if (reportType === 'yearly') {
        return orderYearStr === reportYear
      } else if (reportType === 'custom') {
        return orderDateStr >= reportStartDate && orderDateStr <= reportEndDate
      } else if (reportType === 'all') {
        return true
      }
      return true
    })
  }

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true)
    try {
      const reportOrders = getReportOrders()

      let periodLabel = 'Today'
      let dateRangeText = formatDate(Date.now())

      if (reportType === 'today') {
        periodLabel = 'Today'
        dateRangeText = formatDate(Date.now())
      } else if (reportType === 'monthly') {
        const [y, m] = reportMonth.split('-')
        const monthDate = new Date(Number(y), Number(m) - 1, 1)
        periodLabel = 'Monthly Report'
        dateRangeText = monthDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
      } else if (reportType === 'yearly') {
        periodLabel = 'Annual Report'
        dateRangeText = `Year ${reportYear}`
      } else if (reportType === 'custom') {
        periodLabel = 'Custom Range'
        dateRangeText = `${reportStartDate} to ${reportEndDate}`
      } else if (reportType === 'all') {
        periodLabel = 'All Historical Records'
        dateRangeText = 'Complete Database History'
      }

      generatePdfReport({
        periodLabel,
        dateRangeText,
        orders: reportOrders,
        settings,
        generatedBy: 'Admin'
      })

      setDeleteSuccessToast(`PDF report for "${periodLabel}" generated and downloaded!`)
      setTimeout(() => setDeleteSuccessToast(''), 4000)
      setShowReportModal(false)
    } catch (e) {
      console.error('Failed to generate PDF report:', e)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

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
        api.getOrders(),
        api.getProducts(),
        api.getSettings()
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
    <div className="p-3.5 sm:p-6 md:p-8 h-full overflow-y-auto custom-scrollbar bg-gray-50">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-yolo-dark tracking-tight">Analytics Dashboard</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monitor sales metrics, transaction histories, and beverage popularity.</p>
        </div>

        {/* Date Filter Controls, PDF Export & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-yolo-red hover:bg-red-700 text-white shadow-sm shadow-red-200 px-3 py-2 sm:px-3.5 rounded-xl sm:rounded-2xl active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Download Official Sales Report in PDF"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">Download PDF Report</span>
            <span className="sm:hidden">PDF Report</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-gray-50 border border-gray-200/80 shadow-sm px-3 py-2 sm:px-3.5 rounded-xl sm:rounded-2xl text-gray-600 hover:text-yolo-dark active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
            title="Fetch Latest Real-time Transactions from Cloud"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-yolo-red' : 'text-yolo-red'} />
            <span className="hidden sm:inline">Live Refresh</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <div className="bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-gray-100 p-0.5 sm:p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setFilterMode('today')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterMode === 'today' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterMode === 'all' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setFilterMode('date')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterMode === 'date' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setFilterMode('month')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterMode === 'month' 
                    ? 'bg-white text-yolo-dark shadow-sm' 
                    : 'text-gray-500 hover:text-yolo-dark'
                }`}
              >
                Month
              </button>
            </div>

            {/* Conditional Picker Fields */}
            {filterMode === 'date' && (
              <div className="flex items-center gap-2 pl-2 w-full sm:w-auto pt-1 sm:pt-0">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold border-0 focus:ring-0 text-gray-700 bg-transparent p-0 cursor-pointer outline-none w-full"
                />
              </div>
            )}

            {filterMode === 'month' && (
              <div className="flex items-center gap-2 pl-2 w-full sm:w-auto pt-1 sm:pt-0">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-semibold border-0 focus:ring-0 text-gray-700 bg-transparent p-0 cursor-pointer outline-none w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-5 sm:mb-8">
        
        {/* Metric 1: Revenue */}
        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              {filterMode === 'all' ? "Total Revenue" : filterMode === 'today' ? "Today's Revenue" : filterMode === 'date' ? "Date's Revenue" : "Monthly Revenue"}
            </p>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-yolo-dark truncate">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-green-50 text-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <Coins size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">Total Sales</p>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-yolo-dark truncate">{totalOrdersCount} <span className="text-xs font-normal text-gray-400 hidden sm:inline">Orders</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Metric 3: Average Order Value */}
        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">Avg. Order</p>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-yolo-dark truncate">{formatCurrency(averageOrderValue)}</h3>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-purple-50 text-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <ArrowUpRight size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Metric 4: Low Stock Alerts */}
        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">Low Stock</p>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-yolo-dark truncate">{lowStockAlertsCount} <span className="text-xs font-normal text-gray-400 hidden sm:inline">Items</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-red-50 text-yolo-red rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main content split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Left Side: Recent Activity (Order Feed) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] lg:col-span-3 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-yolo-dark">Recent Transactions</h3>
              <p className="text-[11px] sm:text-xs text-gray-500">Showing {searchedOrders.length} records matching current filter</p>
            </div>
            
            {/* Search orders */}
            <div className="relative w-full sm:w-auto">
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
          <div className="flex-1 overflow-y-auto max-h-[420px] custom-scrollbar">
            {searchedOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <ClipboardList size={40} strokeWidth={1.5} className="mb-2" />
                <p className="text-sm font-medium">No sales orders found.</p>
                <p className="text-xs">Checkout items at POS to view records here.</p>
              </div>
            ) : (
              <div>
                {/* Desktop View: Grid Table Header */}
                <div className="hidden sm:grid grid-cols-12 border-b border-gray-100 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                  <div className="col-span-3">Order Number</div>
                  <div className="col-span-3">Date / Time</div>
                  <div className="col-span-2">Cashier</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-2 text-right pr-2">Actions</div>
                </div>

                {/* Mobile & Desktop List */}
                <div className="divide-y divide-gray-100 sm:divide-gray-50">
                  {searchedOrders.map((order) => (
                    <div key={order.id}>
                      {/* Desktop Grid Row (sm and up) */}
                      <div 
                        onClick={() => setActiveOrder(order)}
                        className="hidden sm:grid grid-cols-12 py-3 items-center text-xs text-gray-600 hover:bg-red-50/60 hover:text-yolo-dark cursor-pointer rounded-xl px-2 transition-all active:scale-[0.99] group"
                      >
                        <div className="col-span-3 font-bold text-yolo-dark group-hover:text-yolo-red transition-colors flex items-center gap-1.5 truncate">
                          <Receipt size={13} className="text-gray-400 group-hover:text-yolo-red shrink-0" />
                          #{order.orderNumber}
                        </div>
                        <div className="col-span-3">
                          <span className="font-medium text-gray-700 block">{formatDate(order.createdAt)}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{formatTime(order.createdAt)}</span>
                        </div>
                        <div className="col-span-2 font-medium text-gray-700 truncate">
                          {order.cashierName || 'Staff'}
                        </div>
                        <div className="col-span-2 text-right font-bold text-yolo-dark">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveOrder(order)}
                            title="View Receipt"
                            className="p-1.5 hover:bg-red-100/80 text-gray-400 hover:text-yolo-red rounded-lg transition-all"
                          >
                            <Receipt size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRequestDelete(order, e)}
                            title="Delete Order (Super Admin Required)"
                            className="p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Card Row (below sm) */}
                      <div 
                        onClick={() => setActiveOrder(order)}
                        className="sm:hidden py-3 px-1 flex flex-col gap-2 hover:bg-red-50/50 cursor-pointer rounded-xl transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-yolo-dark">
                            <Receipt size={14} className="text-yolo-red shrink-0" />
                            <span>#{order.orderNumber}</span>
                          </div>
                          <span className="font-black text-sm text-yolo-dark">
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <span>{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-700">{order.cashierName || 'Staff'}</span>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveOrder(order)}
                              title="View Receipt"
                              className="px-2 py-1 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-yolo-red rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <Receipt size={12} />
                              Receipt
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRequestDelete(order, e)}
                              title="Delete Order"
                              className="p-1 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
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

      {/* Super Admin Order Deletion Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col relative animate-scaleUp">
            
            {/* Close modal X button */}
            <button
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
              className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={18} />
            </button>

            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mb-4 mx-auto shadow-inner">
              <ShieldAlert size={28} />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-yolo-dark">Authorize Order Deletion</h3>
              <p className="text-xs text-gray-500 mt-1">
                Super Admin authentication is required to permanently delete order records.
              </p>
            </div>

            {/* Target Order Summary Card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5 flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Order Number:</span>
                <span className="font-bold text-yolo-dark">#{orderToDelete.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Order Date:</span>
                <span className="font-semibold text-gray-700">{formatDate(orderToDelete.createdAt)} {formatTime(orderToDelete.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Total Amount:</span>
                <span className="font-black text-yolo-red text-sm">{formatCurrency(orderToDelete.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Cashier / Staff:</span>
                <span className="font-semibold text-gray-700">{orderToDelete.cashierName || 'Staff'}</span>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleConfirmDelete} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Super Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value)
                      setPasswordError('')
                    }}
                    placeholder="Enter password to confirm"
                    autoFocus
                    className={`w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                      passwordError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-yolo-red focus:ring-2 focus:ring-red-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1 animate-shake">
                    <AlertTriangle size={13} />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!adminPassword || isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Download PDF Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 flex flex-col relative animate-scaleUp">
            
            {/* Close modal button */}
            <button
              onClick={() => setShowReportModal(false)}
              disabled={isGeneratingPdf}
              className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={18} />
            </button>

            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-yolo-red border border-red-100 flex items-center justify-center mb-3 mx-auto shadow-inner">
              <FileText size={28} />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-yolo-dark">Export Sales Report to PDF</h3>
              <p className="text-xs text-gray-500 mt-1">
                Choose a time period to generate an executive report with metrics and full transactions.
              </p>
            </div>

            {/* Scope Selection Tabs */}
            <div className="bg-gray-100 p-1 rounded-2xl flex flex-wrap gap-1 mb-4">
              {[
                { id: 'today', label: 'Today' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly' },
                { id: 'custom', label: 'Custom Date' },
                { id: 'all', label: 'All Time' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportType(tab.id as any)}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                    reportType === tab.id
                      ? 'bg-white text-yolo-dark shadow-sm'
                      : 'text-gray-500 hover:text-yolo-dark'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conditional Scope Selectors */}
            {reportType === 'monthly' && (
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mb-4 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" /> Select Month:
                </span>
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-yolo-red cursor-pointer"
                />
              </div>
            )}

            {reportType === 'yearly' && (
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mb-4 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" /> Select Year:
                </span>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className="text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-yolo-red cursor-pointer"
                >
                  {[2026, 2025, 2024, 2023].map(yr => (
                    <option key={yr} value={yr.toString()}>{yr}</option>
                  ))}
                </select>
              </div>
            )}

            {reportType === 'custom' && (
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="w-full flex-1">
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">From Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-yolo-red cursor-pointer"
                  />
                </div>
                <div className="w-full flex-1">
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">To Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-800 outline-none focus:border-yolo-red cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Live Preview Card */}
            {(() => {
              const matchedOrders = getReportOrders()
              const previewRevenue = matchedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
              return (
                <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Summary Preview</span>
                    <span className="text-base font-black text-yolo-dark block mt-0.5">{formatCurrency(previewRevenue)}</span>
                    <span className="text-[11px] text-gray-500">{matchedOrders.length} transactions included</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-red-100 text-xs font-bold text-yolo-red shadow-sm uppercase">
                    {reportType === 'today' ? 'Today' : reportType === 'monthly' ? reportMonth : reportType === 'yearly' ? reportYear : reportType === 'custom' ? 'Custom' : 'All Time'}
                  </div>
                </div>
              )
            })()}

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                disabled={isGeneratingPdf}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 py-3 px-4 rounded-xl bg-yolo-red hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={14} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-yolo-dark text-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-700 flex items-center gap-2.5 text-xs font-semibold animate-slideUp">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{deleteSuccessToast}</span>
        </div>
      )}

    </div>
  )
}
