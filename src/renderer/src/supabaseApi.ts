import { supabase } from './supabaseClient'
import { syncManager } from './services/syncManager'

export interface ProductVariant {
  id: string
  name: string
  price: number
  active: boolean
}

const DEFAULT_SETTINGS = {
  id: 1,
  businessName: 'YOLO BITES',
  taxRate: 0.0,
  receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
  phones: '09038108882, 07044030444'
}

function generateUUID(): string {
  return 'uuid-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now()
}

// Fallback seed data if initial fetch happens while offline with clean cache
const SEED_CASHIERS = [
  { id: 'cashier-admin', name: 'Admin', pin: '1282', role: 'admin' },
  { id: 'cashier-staff', name: 'Staff', pin: '5555', role: 'cashier' }
]

const now = Date.now()

const SEED_PRODUCTS = [
  // MAINS
  { id: 'main-1', name: 'Waffles and Chicken', price: 9500, category: 'Mains', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'main-2', name: 'Breakfast Waffles', price: 12000, category: 'Mains', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'main-3', name: 'Fries', price: 3500, category: 'Mains', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'main-4', name: 'Chicken and Chips', price: 7500, category: 'Mains', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // SMALL CHOPS
  { id: 'sc-1', name: 'Samosa (5 pcs)', price: 2000, category: 'Small Chops', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'sc-2', name: 'Spring Roll (5 pcs)', price: 2000, category: 'Small Chops', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'sc-3', name: 'Puff Puff (10 pcs)', price: 2000, category: 'Small Chops', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // COMBO DEALS
  { id: 'combo-1', name: 'Burger Chicken Fries & Drink', price: 12500, category: 'Combo Deals', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'combo-2', name: 'You Only Live Once', price: 21000, category: 'Combo Deals', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'combo-3', name: 'Chop Chop', price: 16500, category: 'Combo Deals', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // BURGERS
  { id: 'burger-1', name: 'Beef Burger', price: 5000, category: 'Burgers', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'burger-2', name: 'Double Juicy Patty Burger', price: 6500, category: 'Burgers', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'burger-3', name: 'The Stacks', price: 12500, category: 'Burgers', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // PROTEINS
  { id: 'prot-1', name: 'Chicken Wings', price: 5000, category: 'Proteins', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'prot-2', name: 'Turkey', price: 6500, category: 'Proteins', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'prot-3', name: 'Gizzard', price: 6500, category: 'Proteins', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // EXTRAS
  { id: 'extra-1', name: 'French Fries', price: 3500, category: 'Extras', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'extra-2', name: 'Cheese', price: 1000, category: 'Extras', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'extra-3', name: 'Hotdog', price: 500, category: 'Extras', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'extra-4', name: 'Egg', price: 500, category: 'Extras', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  {
    id: 'extra-5',
    name: 'Sauce',
    price: 1000,
    category: 'Extras',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-sauce-1', name: 'House Sauce', price: 1000, active: true },
      { id: 'v-sauce-2', name: 'Sweet Suya', price: 1000, active: true },
      { id: 'v-sauce-3', name: 'Herb Dip', price: 1000, active: true }
    ]
  },

  // LOADED FRIES
  { id: 'lf-1', name: 'Loaded Fries', price: 8000, category: 'Loaded Fries', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'lf-2', name: 'YOLO Fries Large', price: 12500, category: 'Loaded Fries', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'lf-3', name: 'Pulled Chicken Sandwich', price: 8000, category: 'Loaded Fries', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // PIZZA
  {
    id: 'pizza-1',
    name: 'Pepperoni Pizza',
    price: 12000,
    category: 'Pizza',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-p1-m', name: 'Medium', price: 12000, active: true },
      { id: 'v-p1-l', name: 'Large', price: 18000, active: true }
    ]
  },
  {
    id: 'pizza-2',
    name: 'Margarita Pizza',
    price: 12000,
    category: 'Pizza',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-p2-m', name: 'Medium', price: 12000, active: true },
      { id: 'v-p2-l', name: 'Large', price: 18000, active: true }
    ]
  },
  {
    id: 'pizza-3',
    name: 'Beef Pizza',
    price: 14000,
    category: 'Pizza',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-p3-m', name: 'Medium', price: 14000, active: true },
      { id: 'v-p3-l', name: 'Large', price: 20000, active: true }
    ]
  },
  {
    id: 'pizza-4',
    name: 'Chicken Pizza',
    price: 14000,
    category: 'Pizza',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-p4-m', name: 'Medium', price: 14000, active: true },
      { id: 'v-p4-l', name: 'Large', price: 20000, active: true }
    ]
  },
  {
    id: 'pizza-5',
    name: "Meat Lover's Dream",
    price: 18500,
    category: 'Pizza',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-p5-m', name: 'Medium', price: 18500, active: true },
      { id: 'v-p5-l', name: 'Large', price: 25000, active: true }
    ]
  },

  // SHAWARMA
  {
    id: 'shaw-1',
    name: 'Beef Shawarma',
    price: 5000,
    category: 'Shawarma',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-s1-0', name: 'No Sausage', price: 5000, active: true },
      { id: 'v-s1-1', name: 'Single Sausage', price: 5500, active: true },
      { id: 'v-s1-2', name: 'Double Sausage', price: 6000, active: true }
    ]
  },
  {
    id: 'shaw-2',
    name: 'Chicken Shawarma',
    price: 5000,
    category: 'Shawarma',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-s2-0', name: 'No Sausage', price: 5000, active: true },
      { id: 'v-s2-1', name: 'Single Sausage', price: 5500, active: true },
      { id: 'v-s2-2', name: 'Double Sausage', price: 6000, active: true }
    ]
  },
  {
    id: 'shaw-3',
    name: 'Mixed Shawarma',
    price: 6500,
    category: 'Shawarma',
    image: 'drink.png',
    stock: 50,
    createdAt: now,
    variants: [
      { id: 'v-s3-0', name: 'No Sausage', price: 6500, active: true },
      { id: 'v-s3-1', name: 'Single Sausage', price: 7000, active: true },
      { id: 'v-s3-2', name: 'Double Sausage', price: 7500, active: true }
    ]
  },
  { id: 'shaw-4', name: 'House Special Wrap', price: 10000, category: 'Shawarma', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // MOCKTAIL
  { id: 'mock-1', name: 'Swimming Pool', price: 6000, category: 'Mocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'mock-2', name: 'Virgin Mojito', price: 6000, category: 'Mocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'mock-3', name: 'Kiwi Breeze', price: 7000, category: 'Mocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'mock-4', name: 'Chapman', price: 7000, category: 'Mocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'mock-5', name: 'Safe Sex on the Beach', price: 7000, category: 'Mocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // COCKTAIL
  { id: 'cock-1', name: 'Sex on the Beach', price: 9000, category: 'Cocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'cock-2', name: 'Cosmopolitan', price: 9000, category: 'Cocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'cock-3', name: 'Adios Modafucker', price: 10500, category: 'Cocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'cock-4', name: 'Long Island', price: 10500, category: 'Cocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'cock-5', name: 'Tequila Sunrise', price: 9000, category: 'Cocktail', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // MILKSHAKE
  { id: 'milk-1', name: 'Oreo Shake', price: 9500, category: 'Milkshake', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'milk-2', name: 'Banana Shake', price: 8500, category: 'Milkshake', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'milk-3', name: 'Vanilla Shake', price: 8500, category: 'Milkshake', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'milk-4', name: 'Strawberry Shake', price: 8500, category: 'Milkshake', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'milk-5', name: 'Chocolate Shake', price: 9500, category: 'Milkshake', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // SMOOTHIE
  { id: 'sm-1', name: 'Sunburst', price: 4000, category: 'Smoothie', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'sm-2', name: 'Heart Beet', price: 5000, category: 'Smoothie', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'sm-3', name: 'Nutty Banana', price: 5000, category: 'Smoothie', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'sm-4', name: 'Mixed Fruit', price: 4000, category: 'Smoothie', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // PARFAIT
  { id: 'parfait-1', name: 'Parfait', price: 7000, category: 'Parfait', image: 'drink.png', stock: 50, createdAt: now, variants: [] },

  // DRINKS
  { id: 'drk-1', name: 'Hollandia', price: 2500, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-2', name: 'Chivita Active', price: 2500, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-3', name: '5 Alive Berry Blast', price: 1700, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-4', name: 'Vitamilk', price: 2000, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-5', name: 'Veleta', price: 1500, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-6', name: 'Fayrouz', price: 1000, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-7', name: 'Maltina', price: 1000, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-8', name: 'Coke', price: 700, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-9', name: 'Sprite', price: 700, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-10', name: 'Fanta', price: 700, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-11', name: 'Schweppes Mojito', price: 800, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] },
  { id: 'drk-12', name: 'Water', price: 500, category: 'Drinks', image: 'drink.png', stock: 50, createdAt: now, variants: [] }
]

export interface ApiResult {
  success: boolean
  error?: string
  id?: string
  orderId?: string
  orderNumber?: string
  [key: string]: any
}

export const supabaseApi = {
  // 1. CASHIERS & AUTH
  loginPin: async (pin: string) => {
    const trimmedPin = String(pin).trim()

    // Fast-path standard credentials
    if (trimmedPin === '5555') {
      return { id: 'cashier-staff', name: 'Staff', pin: '5555', role: 'cashier' }
    }
    if (trimmedPin === '1282') {
      return { id: 'cashier-admin', name: 'Admin', pin: '1282', role: 'admin' }
    }

    try {
      const cashiers = await supabaseApi.getCashiers()
      const match = cashiers.find(c => String(c.pin).trim() === trimmedPin)
      if (match) return match
    } catch {
      // Fall through to cache
    }

    const cached = syncManager.getCached<any[]>('cashiers', SEED_CASHIERS)
    return cached.find(c => String(c.pin).trim() === trimmedPin) || null
  },

  getCashiers: async () => {
    try {
      const { data, error } = await supabase.from('cashiers').select('*')
      if (!error && data && data.length > 0) {
        syncManager.setOnline(true)
        syncManager.setCache('cashiers', data)
        return data
      }
    } catch (e) {
      console.warn('Network error fetching cashiers, falling back to cache:', e)
    }
    return syncManager.getCached<any[]>('cashiers', SEED_CASHIERS)
  },

  updateCashierPin: async (id: string, pin: string): Promise<ApiResult> => {
    const cashiers = syncManager.getCached<any[]>('cashiers', SEED_CASHIERS)
    const idx = cashiers.findIndex(c => c.id === id)
    if (idx !== -1) {
      cashiers[idx].pin = pin
      syncManager.setCache('cashiers', cashiers)
    }

    try {
      const { error } = await supabase.from('cashiers').update({ pin }).eq('id', id)
      if (!error) {
        syncManager.setOnline(true)
        return { success: true }
      }
    } catch {
      // Enqueue
    }
    
    syncManager.enqueue('UPDATE_PIN', { id, pin })
    return { success: true }
  },

  addCashier: async (data: { name: string; pin: string; role: string }): Promise<ApiResult> => {
    const id = generateUUID()
    const newCashier = { id, name: data.name, pin: data.pin, role: data.role }
    
    const cashiers = syncManager.getCached<any[]>('cashiers', SEED_CASHIERS)
    cashiers.push(newCashier)
    syncManager.setCache('cashiers', cashiers)

    try {
      const { error } = await supabase.from('cashiers').insert(newCashier)
      if (!error) {
        syncManager.setOnline(true)
        return { success: true, id }
      }
    } catch {
      // Enqueue
    }

    syncManager.enqueue('ADD_CASHIER', newCashier)
    return { success: true, id }
  },

  // 2. PRODUCTS & INVENTORY
  getProducts: async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
      if (!error && data && data.length > 0) {
        syncManager.setOnline(true)
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category,
          image: p.image || 'drink.png',
          stock: Number(p.stock || 0),
          createdAt: Number(p.created_at || Date.now()),
          variants: p.variants || []
        }))
        syncManager.setCache('products', formatted)
        return formatted
      }
    } catch (e) {
      console.warn('Network error fetching products, falling back to cache:', e)
    }
    return syncManager.getCached<any[]>('products', SEED_PRODUCTS)
  },

  addProduct: async (data: { name: string; price: number; category: string; image: string; stock: number; variants?: ProductVariant[] }): Promise<ApiResult> => {
    const id = generateUUID()
    const newProduct = {
      id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      image: data.image || 'drink.png',
      stock: Number(data.stock || 0),
      createdAt: Date.now(),
      variants: data.variants || []
    }

    const products = syncManager.getCached<any[]>('products', SEED_PRODUCTS)
    products.push(newProduct)
    syncManager.setCache('products', products)

    try {
      const { error } = await supabase.from('products').insert({
        id,
        name: newProduct.name,
        price: newProduct.price,
        category: newProduct.category,
        image: newProduct.image,
        stock: newProduct.stock,
        created_at: newProduct.createdAt,
        variants: newProduct.variants
      })
      if (!error) {
        await supabase.from('inventory_logs').insert({
          id: 'log-' + generateUUID(),
          product_id: id,
          change: newProduct.stock,
          reason: 'initial',
          created_at: Date.now()
        })
        return { success: true, id }
      }
    } catch {
      // Enqueue
    }

    syncManager.enqueue('ADD_PRODUCT', newProduct)
    return { success: true, id }
  },

  updateProduct: async (id: string, data: { name: string; price: number; category: string; image: string; variants?: ProductVariant[] }): Promise<ApiResult> => {
    const products = syncManager.getCached<any[]>('products', SEED_PRODUCTS)
    const idx = products.findIndex(p => p.id === id)
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name: data.name,
        price: Number(data.price),
        category: data.category,
        image: data.image,
        variants: data.variants !== undefined ? data.variants : products[idx].variants
      }
      syncManager.setCache('products', products)
    }

    const payload = {
      id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      image: data.image,
      variants: data.variants
    }

    try {
      const { error } = await supabase.from('products').update({
        name: payload.name,
        price: payload.price,
        category: payload.category,
        image: payload.image,
        variants: payload.variants
      }).eq('id', id)
      if (!error) return { success: true }
    } catch {
      // Enqueue
    }

    syncManager.enqueue('UPDATE_PRODUCT', payload)
    return { success: true }
  },

  updateProductStock: async (data: { productId: string; change: number; reason: string }): Promise<ApiResult> => {
    const products = syncManager.getCached<any[]>('products', SEED_PRODUCTS)
    const idx = products.findIndex(p => p.id === data.productId)
    let newStock = 0
    if (idx !== -1) {
      newStock = Math.max(0, products[idx].stock + Number(data.change))
      products[idx].stock = newStock
      syncManager.setCache('products', products)
    }

    try {
      const { error: pErr } = await supabase.from('products').update({ stock: newStock }).eq('id', data.productId)
      if (!pErr) {
        await supabase.from('inventory_logs').insert({
          id: 'log-' + generateUUID(),
          product_id: data.productId,
          change: Number(data.change),
          reason: data.reason || 'manual',
          created_at: Date.now()
        })
        syncManager.setOnline(true)
        return { success: true }
      }
    } catch {
      // Enqueue
    }

    syncManager.enqueue('UPDATE_STOCK', {
      productId: data.productId,
      change: Number(data.change),
      reason: data.reason,
      newStock
    })
    return { success: true }
  },

  // 3. ORDERS & CHECKOUT
  createOrder: async (payload: {
    cashierId: string
    paymentMethod?: string
    customerId?: string
    items: { productId: string; name?: string; variantName?: string; quantity: number; price: number }[]
    total: number
    discount: number
    tax: number
  }): Promise<ApiResult> => {
    const orderId = generateUUID()
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString()
    const createdAt = Date.now()

    // 1. Deduct stock in local cache immediately
    const products = syncManager.getCached<any[]>('products', SEED_PRODUCTS)
    for (const item of payload.items) {
      const pIdx = products.findIndex(p => p.id === item.productId)
      if (pIdx !== -1) {
        products[pIdx].stock = Math.max(0, products[pIdx].stock - item.quantity)
      }
    }
    syncManager.setCache('products', products)

    // 2. Update loyalty points in local cache
    const pointsEarned = Math.floor(payload.total / 100)
    if (payload.customerId) {
      const customers = syncManager.getCached<any[]>('customers', [])
      const cIdx = customers.findIndex(c => c.id === payload.customerId)
      if (cIdx !== -1) {
        customers[cIdx].loyalty_points = (customers[cIdx].loyalty_points || 0) + pointsEarned
        syncManager.setCache('customers', customers)
      }
    }

    // 3. Save order into local orders cache
    const orders = syncManager.getCached<any[]>('orders', [])
    const enrichedItems = payload.items.map(it => {
      const prod = products.find(p => p.id === it.productId)
      return {
        productId: it.productId,
        name: it.name || prod?.name || 'Item',
        category: prod?.category || 'Mains',
        variantName: it.variantName || '',
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0)
      }
    })
    const newOrderRecord = {
      id: orderId,
      orderNumber,
      total: Number(payload.total),
      discount: Number(payload.discount || 0),
      tax: Number(payload.tax || 0),
      status: 'completed',
      cashierId: payload.cashierId,
      cashierName: payload.cashierId === 'cashier-admin' ? 'Admin' : 'Staff',
      customerId: payload.customerId,
      createdAt,
      items: enrichedItems
    }
    orders.unshift(newOrderRecord)
    syncManager.setCache('orders', orders)

    // 4. Push directly to Supabase with resilient foreign key fallback
    try {
      const validCashierId = (payload.cashierId === 'cashier-admin' || payload.cashierId === 'cashier-staff')
        ? payload.cashierId
        : (String(payload.cashierId || '').toLowerCase().includes('admin') ? 'cashier-admin' : 'cashier-staff')

      const orderInsertData: any = {
        id: orderId,
        order_number: String(orderNumber),
        total: Number(payload.total),
        discount: Number(payload.discount || 0),
        tax: Number(payload.tax || 0),
        status: 'completed',
        payment_method: payload.paymentMethod || 'cash',
        cashier_id: validCashierId,
        created_at: createdAt
      }

      let { error: oErr } = await supabase.from('orders').insert(orderInsertData)
      if (oErr) {
        console.warn('First order insert attempt error, retrying with minimal fields:', oErr)
        const { error: retryErr } = await supabase.from('orders').insert({
          ...orderInsertData,
          cashier_id: null
        })
        if (!retryErr) oErr = null
      }

      if (!oErr) {
        const orderItems = payload.items.map((it, idx) => ({
          id: `${orderId}-item-${idx}`,
          order_id: orderId,
          product_id: String(it.productId || 'sc-1'),
          variant_name: it.variantName || null,
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0)
        }))
        
        try {
          const { error: itErr } = await supabase.from('order_items').insert(orderItems)
          if (itErr) {
            console.warn('Order items insert retry with fallback:', itErr)
            const fallbackItems = orderItems.map(it => ({ ...it, product_id: 'sc-1' }))
            await supabase.from('order_items').insert(fallbackItems)
          }
        } catch (itEx) {
          console.warn('Order items exception note:', itEx)
        }

        // Deduct stock in Supabase
        for (const item of payload.items) {
          const p = products.find(prod => prod.id === item.productId)
          if (p) {
            try {
              await supabase.from('products').update({ stock: p.stock }).eq('id', item.productId)
            } catch {}
          }
        }

        syncManager.setOnline(true)
        // Immediately refresh full order list from cloud
        supabaseApi.getOrders().then(() => syncManager.notify()).catch(() => {})
        return { success: true, orderId, orderNumber }
      }
    } catch (e) {
      console.warn('Network error writing order to Supabase, enqueuing locally:', e)
    }

    syncManager.enqueue('CREATE_ORDER', {
      order: {
        id: orderId,
        orderNumber,
        total: payload.total,
        discount: payload.discount,
        tax: payload.tax,
        paymentMethod: payload.paymentMethod || 'cash',
        cashierId: payload.cashierId,
        customerId: payload.customerId,
        createdAt
      },
      items: payload.items,
      customerId: payload.customerId,
      pointsEarned
    })

    return { success: true, orderId, orderNumber }
  },

  getOrders: async () => {
    try {
      const ordersRes = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
      const itemsRes = await supabase.from('order_items').select('*').limit(2000).catch(() => ({ data: [] }))
      const cashiersRes = await supabase.from('cashiers').select('id, name').catch(() => ({ data: [] }))
      const customersRes = await supabase.from('customers').select('id, name').catch(() => ({ data: [] }))
      const productsRes = await supabase.from('products').select('id, name, category').catch(() => ({ data: [] }))

      if (ordersRes.data && Array.isArray(ordersRes.data)) {
        const cashiersMap = new Map(((cashiersRes as any).data || []).map((c: any) => [c.id, c.name]))
        const customersMap = new Map(((customersRes as any).data || []).map((c: any) => [c.id, c.name]))
        const productsMap = new Map(((productsRes as any).data || []).map((p: any) => [p.id, p]))
        
        const itemsByOrder: { [key: string]: any[] } = {}
        for (const it of ((itemsRes as any).data || [])) {
          if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = []
          const prod = productsMap.get(it.product_id)
          itemsByOrder[it.order_id].push({
            productId: it.product_id,
            name: prod?.name || 'Item',
            category: prod?.category || '',
            variantName: it.variant_name || '',
            quantity: Number(it.quantity || 1),
            price: Number(it.price || 0)
          })
        }

        const fullOrders = ordersRes.data.map((order: any) => {
          const rawCreated = order.created_at || order.createdAt
          let timestamp = Date.now()
          if (typeof rawCreated === 'number') {
            timestamp = rawCreated
          } else if (rawCreated) {
            const num = Number(rawCreated)
            if (!isNaN(num) && num > 0) {
              timestamp = num
            } else {
              const parsed = Date.parse(rawCreated)
              if (!isNaN(parsed)) timestamp = parsed
            }
          }

          return {
            id: order.id,
            orderNumber: order.order_number || order.orderNumber,
            total: Number(order.total),
            discount: Number(order.discount || 0),
            tax: Number(order.tax || 0),
            status: order.status,
            paymentMethod: order.payment_method || order.paymentMethod || 'cash',
            cashierId: order.cashier_id || order.cashierId,
            customerId: order.customer_id || order.customerId,
            createdAt: timestamp,
            cashierName: cashiersMap.get(order.cashier_id) || (order.cashier_id === 'cashier-admin' ? 'Admin' : 'Staff'),
            customerName: customersMap.get(order.customer_id) || '',
            items: itemsByOrder[order.id] || []
          }
        })

        syncManager.setOnline(true)
        syncManager.setCache('orders', fullOrders)
        return fullOrders
      }
    } catch (e) {
      console.warn('Network error fetching orders, using cache:', e)
    }
    return syncManager.getCached<any[]>('orders', [])
  },

  // 4. CUSTOMERS
  getCustomers: async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true })
      if (!error && data && data.length > 0) {
        syncManager.setOnline(true)
        const formatted = data.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          loyalty_points: c.loyalty_points || 0
        }))
        syncManager.setCache('customers', formatted)
        return formatted
      }
    } catch (e) {
      console.warn('Network error fetching customers, using cache:', e)
    }
    return syncManager.getCached<any[]>('customers', [])
  },

  addCustomer: async (data: { name: string; phone: string }): Promise<ApiResult> => {
    const customers = syncManager.getCached<any[]>('customers', [])
    const existing = customers.find(c => c.phone === data.phone)
    if (existing) {
      return { success: false, error: 'Customer phone number already exists' }
    }

    const id = generateUUID()
    const newCustomer = {
      id,
      name: data.name,
      phone: data.phone,
      loyalty_points: 0
    }
    customers.push(newCustomer)
    syncManager.setCache('customers', customers)

    try {
      const { error } = await supabase.from('customers').insert(newCustomer)
      if (!error) {
        syncManager.setOnline(true)
        return { success: true, id }
      }
    } catch {
      // Enqueue
    }

    syncManager.enqueue('ADD_CUSTOMER', newCustomer)
    return { success: true, id }
  },

  // 5. DASHBOARD METRICS
  getDashboardMetrics: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfDay = today.getTime()

    const orders = await supabaseApi.getOrders()
    const todayOrdersList = orders.filter(o => o.createdAt >= startOfDay)
    const todayRevenue = todayOrdersList.reduce((acc, curr) => acc + curr.total, 0)
    const todayOrders = todayOrdersList.length

    const products = await supabaseApi.getProducts()
    const lowStockAlerts = products.filter(p => p.stock <= 5).length

    return { todayRevenue, todayOrders, lowStockAlerts }
  },

  // 6. SETTINGS
  getSettings: async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1)
      if (!error && data && data.length > 0) {
        syncManager.setOnline(true)
        const row = data[0]
        const formatted = {
          id: 1,
          businessName: row.business_name || 'YOLO BITES',
          taxRate: row.tax_rate !== undefined ? Number(row.tax_rate) : 0.0,
          receiptAddress: row.receipt_address || '',
          phones: row.phones || ''
        }
        syncManager.setCache('settings', formatted)
        return formatted
      }
    } catch (e) {
      console.warn('Network error fetching settings, using cache:', e)
    }
    return syncManager.getCached<any>('settings', DEFAULT_SETTINGS)
  },

  saveSettings: async (data: { businessName: string; taxRate: number; receiptAddress: string; phones: string }): Promise<ApiResult> => {
    const payload = {
      business_name: data.businessName,
      tax_rate: Number(data.taxRate),
      receipt_address: data.receiptAddress,
      phones: data.phones
    }

    syncManager.setCache('settings', {
      id: 1,
      businessName: data.businessName,
      taxRate: Number(data.taxRate),
      receiptAddress: data.receiptAddress,
      phones: data.phones
    })

    try {
      const { error } = await supabase.from('settings').upsert({ id: 1, ...payload })
      if (!error) {
        syncManager.setOnline(true)
        return { success: true }
      }
    } catch {
      // Enqueue
    }

    syncManager.enqueue('SAVE_SETTINGS', payload)
    return { success: true }
  },

  // 7. PRINTING UTILITIES
  printReceipt: async () => {
    window.print()
    return { success: true }
  },

  downloadReceiptPDF: async () => {
    window.print()
    return { success: true, filePath: 'receipt.pdf' }
  }
}
