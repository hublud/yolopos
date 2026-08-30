import { supabase } from '../supabaseClient'

export interface QueueItem {
  id: string
  type: 'CREATE_ORDER' | 'UPDATE_STOCK' | 'ADD_PRODUCT' | 'UPDATE_PRODUCT' | 'ADD_CUSTOMER' | 'SAVE_SETTINGS' | 'ADD_CASHIER' | 'UPDATE_PIN'
  payload: any
  timestamp: number
}

type NetworkListener = (isOnline: boolean, pendingCount: number) => void

class SyncManager {
  private isOnline: boolean = navigator.onLine
  private listeners: NetworkListener[] = []
  private isSyncing: boolean = false

  constructor() {
    window.addEventListener('online', () => this.forceCheck())
    window.addEventListener('offline', () => this.handleNetworkChange(false))
    
    // Periodically verify true internet connectivity by pinging Supabase
    setInterval(() => {
      this.forceCheck()
    }, 15000)

    // Initial connectivity check immediately
    this.forceCheck()
  }

  public getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.getQueue().length
    }
  }

  public subscribe(listener: NetworkListener) {
    this.listeners.push(listener)
    listener(this.isOnline, this.getQueue().length)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  public notify() {
    const queueLen = this.getQueue().length
    this.listeners.forEach(l => l(this.isOnline, queueLen))
  }

  public setOnline(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online
      this.notify()
    }
  }

  public async forceCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1)
      const isReachable = !error && data !== null
      this.handleNetworkChange(isReachable)
      return isReachable
    } catch {
      this.handleNetworkChange(false)
      return false
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online
    this.notify()
    if (online && this.getQueue().length > 0 && !this.isSyncing) {
      this.syncPendingData()
    }
  }

  // Queue Management
  public getQueue(): QueueItem[] {
    try {
      const stored = localStorage.getItem('pos_offline_queue')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveQueue(queue: QueueItem[]) {
    localStorage.setItem('pos_offline_queue', JSON.stringify(queue))
    this.notify()
  }

  public enqueue(type: QueueItem['type'], payload: any): string {
    const queue = this.getQueue()
    const id = 'queue-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now()
    queue.push({
      id,
      type,
      payload,
      timestamp: Date.now()
    })
    this.saveQueue(queue)
    return id
  }

  // Cache Utilities
  public getCached<T>(key: string, fallback: T): T {
    try {
      const val = localStorage.getItem('pos_cache_' + key)
      return val ? JSON.parse(val) : fallback
    } catch {
      return fallback
    }
  }

  public setCache<T>(key: string, value: T): void {
    try {
      localStorage.setItem('pos_cache_' + key, JSON.stringify(value))
    } catch (e) {
      console.warn('Cache write failed:', e)
    }
  }

  // Synchronize all pending offline items to Supabase
  public async syncPendingData(skipSyncingFlag = false): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (this.isSyncing && !skipSyncingFlag) return { success: false, syncedCount: 0, errors: ['Sync already in progress'] }
    
    const queue = this.getQueue()
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, errors: [] }
    }

    this.isSyncing = true
    this.notify()

    const errors: string[] = []
    let syncedCount = 0
    const remainingQueue: QueueItem[] = []

    for (const item of queue) {
      try {
        let err: any = null

        switch (item.type) {
          case 'CREATE_ORDER': {
            const { order, items, customerId, pointsEarned } = item.payload
            const { error: oErr } = await supabase.from('orders').upsert({
              id: order.id,
              order_number: order.orderNumber,
              total: order.total,
              discount: order.discount || 0,
              tax: order.tax || 0,
              status: order.status || 'completed',
              cashier_id: order.cashierId || null,
              customer_id: order.customerId || null,
              created_at: order.createdAt
            })
            if (oErr) {
              err = oErr
              break
            }

            if (items && items.length > 0) {
              const orderItems = items.map((it: any, idx: number) => ({
                id: `${order.id}-item-${idx}`,
                order_id: order.id,
                product_id: it.productId,
                quantity: it.quantity,
                price: it.price
              }))
              const { error: itErr } = await supabase.from('order_items').upsert(orderItems)
              if (itErr) err = itErr
            }

            // Sync loyalty points increment
            if (customerId && pointsEarned) {
              const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single()
              if (cust) {
                await supabase.from('customers').update({
                  loyalty_points: (cust.loyalty_points || 0) + pointsEarned
                }).eq('id', customerId)
              }
            }
            break
          }

          case 'UPDATE_STOCK': {
            const { productId, change, reason, newStock } = item.payload
            // Update product stock
            if (newStock !== undefined) {
              await supabase.from('products').update({ stock: newStock }).eq('id', productId)
            }
            // Add inventory log
            const { error: lErr } = await supabase.from('inventory_logs').insert({
              id: 'log-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
              product_id: productId,
              change,
              reason: reason || 'restock',
              created_at: item.timestamp
            })
            if (lErr) err = lErr
            break
          }

          case 'ADD_PRODUCT': {
            const { error: pErr } = await supabase.from('products').insert(item.payload)
            if (pErr) err = pErr
            break
          }

          case 'UPDATE_PRODUCT': {
            const { id, ...data } = item.payload
            const { error: uErr } = await supabase.from('products').update(data).eq('id', id)
            if (uErr) err = uErr
            break
          }

          case 'ADD_CUSTOMER': {
            const { error: cErr } = await supabase.from('customers').insert(item.payload)
            if (cErr) err = cErr
            break
          }

          case 'SAVE_SETTINGS': {
            const { error: sErr } = await supabase.from('settings').upsert({ id: 1, ...item.payload })
            if (sErr) err = sErr
            break
          }

          case 'ADD_CASHIER': {
            const { error: caErr } = await supabase.from('cashiers').insert(item.payload)
            if (caErr) err = caErr
            break
          }

          case 'UPDATE_PIN': {
            const { id, pin } = item.payload
            const { error: pinErr } = await supabase.from('cashiers').update({ pin }).eq('id', id)
            if (pinErr) err = pinErr
            break
          }
        }

        if (err) {
          console.error(`Failed syncing item ${item.id}:`, err)
          errors.push(`Action ${item.type} failed: ${err.message || JSON.stringify(err)}`)
          remainingQueue.push(item)
        } else {
          syncedCount++
        }
      } catch (ex: any) {
        errors.push(`Exception syncing ${item.type}: ${ex.message}`)
        remainingQueue.push(item)
      }
    }

    this.saveQueue(remainingQueue)
    this.isSyncing = false
    this.notify()

    return {
      success: errors.length === 0,
      syncedCount,
      errors
    }
  }

  // Full manual synchronization & remote refresh
  public async syncAll(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    this.isSyncing = true
    this.notify()

    try {
      // 1. Fetch latest products and update cache
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*').order('name', { ascending: true })
      
      if (prodErr) {
        throw prodErr
      }

      this.handleNetworkChange(true)

      if (prodData) {
        const formatted = prodData.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category,
          image: p.image || 'drink.png',
          stock: Number(p.stock || 0),
          createdAt: Number(p.created_at || Date.now()),
          variants: p.variants || []
        }))
        this.setCache('products', formatted)
      }

      // 2. Fetch latest settings
      const { data: setData } = await supabase.from('settings').select('*').limit(1)
      if (setData && setData.length > 0) {
        const s = setData[0]
        this.setCache('settings', {
          businessName: s.business_name || 'YOLO BITES',
          taxRate: s.tax_rate !== undefined ? Number(s.tax_rate) : 10.0,
          receiptAddress: s.receipt_address || '',
          phones: s.phones || ''
        })
      }

      // 3. Sync pending offline items
      const queueResult = await this.syncPendingData(true)

      this.isSyncing = false
      this.notify()

      let message = 'All data synchronized and connected to cloud!'
      if (queueResult.syncedCount > 0) {
        message = `Successfully uploaded ${queueResult.syncedCount} offline record(s) and synced with cloud!`
      }

      return {
        success: true,
        message,
        syncedCount: queueResult.syncedCount
      }
    } catch (e: any) {
      console.warn('Sync failed:', e)
      this.handleNetworkChange(false)
      this.isSyncing = false
      this.notify()
      return {
        success: false,
        message: 'Could not connect to Supabase Cloud. Check internet connection.',
        syncedCount: 0
      }
    }
  }
}

export const syncManager = new SyncManager()

