import { useState, useRef } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, Smartphone, X, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReceiptModal } from '../components/ReceiptModal'
import { ProductImage } from '../components/ProductImage'
// @ts-ignore
import logoSrc from '../assets/logo.jpeg'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-50 text-green-700 border-green-300', active: 'bg-green-600 text-white border-green-600' },
  { id: 'pos', label: 'POS', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-300', active: 'bg-blue-600 text-white border-blue-600' },
  { id: 'transfer', label: 'Transfer', icon: Smartphone, color: 'bg-purple-50 text-purple-700 border-purple-300', active: 'bg-purple-600 text-white border-purple-600' },
]

export function POS({ cashier, products, settings, loading }: { cashier: any; products: any[]; settings: any; loading?: boolean }) {
  const [cart, setCart] = useState<any[]>([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [receiptData, setReceiptData] = useState<any>(null)
  
  // Category Horizontal Scrolling & Dragging
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth'
      })
    }
  }

  const handleCategoryWheel = (e: React.WheelEvent) => {
    if (categoryScrollRef.current && e.deltaY !== 0) {
      categoryScrollRef.current.scrollLeft += e.deltaY
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft)
    setScrollLeftState(categoryScrollRef.current.scrollLeft)
  }

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoryScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - categoryScrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    categoryScrollRef.current.scrollLeft = scrollLeftState - walk
  }

  // Product Variant Selection Modal State
  const [variantModalProduct, setVariantModalProduct] = useState<any>(null)

  // Categories derived from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(p => {
    const matchesCategory = category === 'All' || p.category === category
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleProductCardClick = (product: any) => {
    if (product.stock <= 0) return
    const activeVariants = (product.variants || []).filter((v: any) => v.active !== false)
    if (activeVariants.length > 0) {
      setVariantModalProduct(product)
    } else {
      addToCart(product)
    }
  }

  const addToCart = (product: any, variant?: any) => {
    if (product.stock <= 0) return

    const cartItemId = variant ? `${product.id}-${variant.id || variant.name}` : product.id
    const displayName = variant ? `${product.name} (${variant.name})` : product.name
    const price = variant ? Number(variant.price) : Number(product.price)

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, {
        id: cartItemId,
        productId: product.id,
        name: displayName,
        baseName: product.name,
        variantName: variant ? variant.name : undefined,
        price,
        image: product.image,
        category: product.category,
        quantity: 1,
        stock: product.stock
      }]
    })

    if (variantModalProduct) {
      setVariantModalProduct(null)
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        if (newQ < 1) return item
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxRate = settings ? Number(settings.taxRate) : 0.0
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax - discount

  const handleCheckout = async () => {
    if (cart.length === 0) return

    const payload = {
      cashierId: cashier.id,
      items: cart.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        price: item.price
      })),
      total,
      discount,
      tax,
      paymentMethod
    }

    try {
      // @ts-ignore
      const result = await window.api.createOrder(payload)
      if (result.success) {
        setReceiptData({
          orderNumber: result.orderNumber,
          cashierName: cashier.name,
          createdAt: Date.now(),
          items: cart,
          subtotal,
          tax,
          taxRate,
          discount,
          total,
          paymentMethod,
          settings
        })
        setCart([])
        setDiscount(0)
        setPaymentMethod('cash')
      } else {
        alert('Checkout failed: ' + result.error)
      }
    } catch (e) {
      alert('Error connecting to database.')
    }
  }

  return (
    <>
      <div className="flex w-full h-full">
        {/* Product Area */}
        <div className="flex-1 flex flex-col px-6 pb-6 h-full overflow-y-auto custom-scrollbar">
          {/* Search Bar (Scrolls with page content) */}
          <div className="pt-6 pb-3 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-white border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-yolo-red/30 focus:border-yolo-red text-sm transition-all shadow-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Category Nav (Sticks to top when scrolled) */}
          <div className="sticky top-0 z-20 bg-yolo-cream/95 backdrop-blur-md py-2.5 mb-3 flex items-center">
            {/* Scroll Left Button */}
            <button 
              type="button"
              onClick={() => scrollCategories('left')}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-yolo-dark hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center mr-2 shrink-0 z-10"
              title="Scroll Left"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Scrollable Category Strip */}
            <div 
              ref={categoryScrollRef}
              onWheel={handleCategoryWheel}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className={`flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth flex-1 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {loading && products.length === 0 ? (
                <>
                  <div className="px-5 py-2 rounded-full text-sm font-semibold bg-yolo-dark text-white shadow-md shadow-black/10 shrink-0">
                    All
                  </div>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div 
                      key={i} 
                      className="h-9 w-24 rounded-full bg-white/80 border border-gray-200/60 animate-pulse shrink-0" 
                    />
                  ))}
                </>
              ) : (
                categories.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      if (!isDragging) setCategory(c)
                    }}
                    className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 select-none ${
                      category === c 
                        ? 'bg-yolo-dark text-white shadow-md shadow-black/10 scale-[1.02]' 
                        : 'bg-white text-gray-600 border border-gray-200/80 hover:border-yolo-red hover:text-yolo-red hover:bg-white shadow-sm active:scale-95'
                    }`}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>

            {/* Scroll Right Button */}
            <button 
              type="button"
              onClick={() => scrollCategories('right')}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-yolo-dark hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center ml-2 shrink-0 z-10"
              title="Scroll Right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Product Grid / Loading / Empty State */}
          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-5">
              {/* Branded Logo with Spinning Glow Ring */}
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl border border-gray-100 flex items-center justify-center p-2.5 relative overflow-hidden z-10">
                  <img src={logoSrc} alt="YOLO BITES" className="w-full h-full object-contain rounded-2xl animate-pulse" />
                </div>
                <div className="absolute -inset-2.5 rounded-[30px] border-2 border-dashed border-yolo-red/40 animate-spin pointer-events-none" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-yolo-dark tracking-tight">Loading YOLO BITES Menu...</h3>
                <p className="text-xs text-gray-400 mt-0.5">Fetching fresh items and category lists</p>
              </div>

              {/* Skeleton Cards Preview */}
              <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="bg-white/80 rounded-2xl p-3 border border-gray-100/80 shadow-sm flex flex-col animate-pulse">
                    <div className="w-full aspect-square bg-gray-100/80 rounded-xl mb-3" />
                    <div className="h-4 bg-gray-200/70 rounded-md w-3/4 mb-2" />
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="h-4 bg-gray-200/70 rounded-md w-1/3" />
                      <div className="w-6 h-6 rounded-full bg-gray-200/70" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ShoppingBag size={48} strokeWidth={1.5} className="mb-3 opacity-40 text-gray-400" />
              <p className="text-base font-semibold text-gray-600">No products found</p>
              <p className="text-xs mt-1 text-gray-400">
                {search ? `No items matching "${search}"` : 'Try selecting another category or add products in Inventory'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
              {filteredProducts.map(product => {
                const activeVariants = (product.variants || []).filter((v: any) => v.active !== false)
                const hasVariants = activeVariants.length > 0

                return (
                  <div 
                    key={product.id}
                    onClick={() => handleProductCardClick(product)}
                    className={`bg-white rounded-2xl p-3 border border-gray-100 shadow-sm transition-all select-none group flex flex-col ${
                      product.stock > 0 
                        ? 'cursor-pointer hover:shadow-md hover:border-yolo-red/30 active:scale-95' 
                        : 'opacity-60 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                      <ProductImage image={product.image} category={product.category} />
                      
                      {hasVariants && (
                        <span className="absolute top-2 left-2 bg-yolo-dark/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm">
                          <Layers size={10} />
                          {activeVariants.length} Options
                        </span>
                      )}

                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Only {product.stock} left
                        </span>
                      )}
                      {product.stock <= 0 && (
                        <span className="absolute inset-0 bg-white/60 flex items-center justify-center text-yolo-red font-bold text-sm backdrop-blur-sm">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{product.name}</h3>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-bold text-yolo-red">
                          {hasVariants ? `From ₦${Math.min(...activeVariants.map(v => Number(v.price))).toLocaleString()}` : `₦${Number(product.price).toLocaleString()}`}
                        </span>
                        <button className="w-6 h-6 rounded-full bg-yolo-cream text-yolo-dark flex items-center justify-center group-hover:bg-yolo-red group-hover:text-white transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-[-4px_0_15px_-10px_rgba(0,0,0,0.1)] z-10 shrink-0">
          <div className="py-4 px-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-yolo-dark">
              <ShoppingBag className="text-yolo-red" size={20} />
              Current Order
            </h2>
            <span className="bg-red-50 text-yolo-red font-bold px-2 py-0.5 rounded-full text-xs">
              {cart.reduce((s, i) => s + i.quantity, 0)} Items
            </span>
          </div>

          {/* Unified Scrollable Container for Cart Items and Totals/Checkout */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30 flex flex-col gap-4">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16">
                <ShoppingBag size={40} strokeWidth={1.5} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">Your cart is empty</p>
                <p className="text-xs mt-0.5 opacity-80">Select items to start order</p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="flex flex-col gap-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-2.5 bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 items-center">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        <ProductImage image={item.image} category={item.category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-gray-800 truncate">{item.name}</h4>
                        <p className="text-yolo-red font-bold text-xs mt-0.5">₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-full p-0.5 border border-gray-100">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)} 
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-yolo-dark hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="font-bold text-xs w-3 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)} 
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-yolo-dark hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                      <button 
                            onClick={() => removeFromCart(item.id)} 
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-yolo-red hover:bg-red-50 rounded-full transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals & Checkout Panel */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-auto flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-gray-500 text-xs font-medium">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs font-medium">
                      <span>Tax ({taxRate}%)</span>
                      <span>₦{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-yolo-dark text-xs font-bold pt-2.5 border-t border-dashed border-gray-200 mt-1">
                      <span>Total</span>
                      <span className="text-yolo-red text-base font-black">₦{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Payment Method</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PAYMENT_METHODS.map(({ id, label, icon: Icon, color, active }) => (
                        <button
                          key={id}
                          onClick={() => setPaymentMethod(id)}
                          className={`flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-lg border-2 font-bold text-[10px] transition-all ${
                            paymentMethod === id ? active : color
                          }`}
                        >
                          <Icon size={14} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                      cart.length === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-yolo-red text-white hover:bg-red-700 shadow-md hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    <CreditCard size={15} />
                    CHECKOUT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Variant Selection Modal */}
      {variantModalProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => setVariantModalProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                <ProductImage image={variantModalProduct.image} category={variantModalProduct.category} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-yolo-dark">{variantModalProduct.name}</h3>
                <p className="text-xs text-gray-400">Select option / size</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 my-4">
              {(variantModalProduct.variants || [])
                .filter((v: any) => v.active !== false)
                .map((v: any) => (
                  <button
                    key={v.id || v.name}
                    onClick={() => addToCart(variantModalProduct, v)}
                    className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-gray-100 hover:border-yolo-red hover:bg-red-50/50 transition-all text-left group active:scale-98"
                  >
                    <span className="font-bold text-gray-800 text-sm group-hover:text-yolo-red transition-colors">
                      {v.name}
                    </span>
                    <span className="font-extrabold text-yolo-red text-sm">
                      ₦{Number(v.price).toLocaleString()}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {receiptData && (
        <ReceiptModal order={receiptData} onClose={() => setReceiptData(null)} />
      )}
    </>
  )
}
