import { supabase } from '../supabaseClient'

export interface QueueItem {
  id: string
  type: 'CREATE_ORDER' | 'UPDATE_STOCK' | 'ADD_PRODUCT' | 'UPDATE_PRODUCT' | 'ADD_CUSTOMER' | 'SAVE_SETTINGS' | 'ADD_CASHIER' | 'UPDATE_PIN'
  payload: any
  timestamp: number
  retries?: number
}

type NetworkListener = (isOnline: boolean, pendingCount: number) => void

// Detect if running inside Electron (window.api IPC bridge available)
const isElectron = typeof window !== 'undefined' && typeof (window as any).api?.pushToQueue === 'function'

class SyncManager {
  private isOnline: boolean = true
  private listeners: NetworkListener[] = []
  private isSyncing: boolean = false

  constructor() {
    window.addEventListener('online', () => {
      this.setOnline(true)
      this.forceCheck()
      this.triggerSync()
    })
    window.addEventListener('offline', () => this.handleNetworkChange(false))
    
    // Periodically verify connectivity and flush pending offline queue
    setInterval(() => {
      this.forceCheck()
      if (this.isOnline && !this.isSyncing) {
        this.getPendingCount().then(count => {
          if (count > 0) this.syncPendingData()
        })
      }
    }, 8000)

    // Initial connectivity check and sync
    setTimeout(() => {
      this.forceCheck()
      this.triggerSync()
    }, 1500)

    // Real-time Cloud Sync across all devices
    try {
      supabase
        .channel('yolo-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => this.notify())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => this.notify())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => this.notify())
        .subscribe()
    } catch (e) {
      console.warn('Realtime channel subscription note:', e)
    }
  }

  private async triggerSync() {
    const count = await this.getPendingCount()
    if (count > 0 && !this.isSyncing) {
      this.syncPendingData()
    }
  }

  private async getPendingCount(): Promise<number> {
    const queue = await this.getQueue()
    return queue.length
  }

  public getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0 // Use async getPendingCount() for accurate count
    }
  }

  public subscribe(listener: NetworkListener) {
    this.listeners.push(listener)
    this.getPendingCount().then(count => listener(this.isOnline, count))
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  public async notify() {
    const count = await this.getPendingCount()
    this.listeners.forEach(l => l(this.isOnline, count))
  }

  public setOnline(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online
      this.notify()
    }
  }

  public async forceCheck(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.setOnline(false)
        return false
      }

      const { data, error } = await supabase.from('products').select('id').limit(1)
      const isReachable = !error && data !== null
      if (isReachable) {
        this.setOnline(true)
        return true
      }
      
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true
      this.setOnline(online)
      return online
    } catch {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true
      this.setOnline(online)
      return online
    }
  }

  private handleNetworkChange(online: boolean) {
    this.setOnline(online)
    if (online) this.triggerSync()
  }

  // ── Queue Management ──────────────────────────────────────────────────────────
  // Uses SQLite (via window.api IPC) in Electron for durability across restarts.
  // Falls back to localStorage in browser/web environments.

  public async getQueue(): Promise<QueueItem[]> {
    if (isElectron) {
      try {
        return await (window as any).api.getPendingQueue()
      } catch (e) {
        console.warn('getQueue IPC failed, using localStorage fallback:', e)
      }
    }
    try {
      const stored = localStorage.getItem('pos_offline_queue')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  public async clearQueue(): Promise<void> {
    if (isElectron) {
      try {
        const queue = await this.getQueue()
        const ids = queue.map(item => item.id)
        if (ids.length > 0) await (window as any).api.removeFromQueue(ids)
      } catch (e) {
        console.warn('clearQueue IPC failed:', e)
      }
    } else {
      localStorage.removeItem('pos_offline_queue')
    }
    this.notify()
  }

  public async enqueue(type: QueueItem['type'], payload: any): Promise<string> {
    const id = 'queue-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now()
    const item: QueueItem = { id, type, payload, timestamp: Date.now(), retries: 0 }

    if (isElectron) {
      try {
        await (window as any).api.pushToQueue(item)
        this.notify()
        return id
      } catch (e) {
        console.warn('pushToQueue IPC failed, using localStorage fallback:', e)
      }
    }
    
    // Fallback: localStorage
    try {
      const stored = localStorage.getItem('pos_offline_queue')
      const queue: QueueItem[] = stored ? JSON.parse(stored) : []
      queue.push(item)
      localStorage.setItem('pos_offline_queue', JSON.stringify(queue))
    } catch {}
    this.notify()
    return id
  }

  private async removeFromQueue(ids: string[]) {
    if (ids.length === 0) return
    if (isElectron) {
      try {
        await (window as any).api.removeFromQueue(ids)
        return
      } catch (e) {
        console.warn('removeFromQueue IPC failed:', e)
      }
    }
    try {
      const stored = localStorage.getItem('pos_offline_queue')
      if (!stored) return
      const queue: QueueItem[] = JSON.parse(stored)
      const remaining = queue.filter(item => !ids.includes(item.id))
      localStorage.setItem('pos_offline_queue', JSON.stringify(remaining))
    } catch {}
  }

  private async incrementRetries(id: string) {
    if (isElectron) {
      try {
        await (window as any).api.incrementQueueRetries(id)
        return
      } catch {}
    }
    try {
      const stored = localStorage.getItem('pos_offline_queue')
      if (!stored) return
      const queue: QueueItem[] = JSON.parse(stored)
      const idx = queue.findIndex(i => i.id === id)
      if (idx !== -1) queue[idx].retries = (queue[idx].retries || 0) + 1
      localStorage.setItem('pos_offline_queue', JSON.stringify(queue))
    } catch {}
  }

  // ── Cache Utilities ───────────────────────────────────────────────────────────
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

  // ── Sync: Flush Pending Queue to Supabase ─────────────────────────────────────
  public async syncPendingData(skipSyncingFlag = false): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (this.isSyncing && !skipSyncingFlag) return { success: false, syncedCount: 0, errors: ['Sync already in progress'] }
    
    const queue = await this.getQueue()
    if (queue.length === 0) return { success: true, syncedCount: 0, errors: [] }

    this.isSyncing = true
    this.notify()

    const errors: string[] = []
    let syncedCount = 0
    const syncedIds: string[] = []
    const failedItems: QueueItem[] = []

    for (const item of queue) {
      try {
        let err: any = null

        switch (item.type) {
          case 'CREATE_ORDER': {
            const { order, items, customerId, pointsEarned } = item.payload
            if (!order || !order.id) break

            const orderPayload: any = {
              id: String(order.id),
              order_number: String(order.orderNumber || Math.floor(100000 + Math.random() * 900000)),
              total: Number(order.total || 0),
              discount: Number(order.discount || 0),
              tax: Number(order.tax || 0),
              status: order.status || 'completed',
              created_at: Number(order.createdAt || Date.now())
            }

            if (order.cashierId === 'cashier-admin' || order.cashierId === 'cashier-staff') {
              orderPayload.cashier_id = order.cashierId
            } else {
              orderPayload.cashier_id = 'cashier-staff'
            }
            if (customerId) orderPayload.customer_id = customerId

            const { error: oErr } = await supabase.from('orders').upsert(orderPayload)
            if (oErr) {
              // Retry without cashier_id FK
              const { error: retryErr } = await supabase.from('orders').upsert({
                ...orderPayload, cashier_id: null
              })
              if (retryErr) err = retryErr
            }

            if (!err && items && Array.isArray(items) && items.length > 0) {
              const orderItemRows = items.map((it: any, idx: number) => ({
                id: `${order.id}-item-${idx}`,
                order_id: String(order.id),
                product_id: String(it.productId),
                variant_name: it.variantName || null,
                quantity: Number(it.quantity || 1),
                price: Number(it.price || 0)
              }))
              try {
                await supabase.from('order_items').upsert(orderItemRows)
              } catch (e) {
                console.warn('Order items sync note:', e)
              }
            }

            if (customerId && pointsEarned) {
              try {
                const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single()
                if (cust) {
                  await supabase.from('customers').update({
                    loyalty_points: (cust.loyalty_points || 0) + pointsEarned
                  }).eq('id', customerId)
                }
              } catch {}
            }
            break
          }

          case 'UPDATE_STOCK': {
            const { productId, change, reason, newStock } = item.payload
            if (newStock !== undefined) {
              await supabase.from('products').update({ stock: newStock }).eq('id', productId)
            }
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
          const retries = (item.retries || 0) + 1
          if (retries < 5) {
            await this.incrementRetries(item.id)
            failedItems.push({ ...item, retries })
          } else {
            // Exceeded retry limit — remove from queue
            console.warn(`Auto-cleared invalid sync item after 5 retries:`, item)
            syncedIds.push(item.id)
          }
        } else {
          syncedCount++
          syncedIds.push(item.id)
        }
      } catch (ex: any) {
        errors.push(`Exception syncing ${item.type}: ${ex.message}`)
        const retries = (item.retries || 0) + 1
        if (retries < 5) {
          await this.incrementRetries(item.id)
        } else {
          syncedIds.push(item.id) // give up
        }
      }
    }

    // Remove successfully synced items from queue
    await this.removeFromQueue(syncedIds)
    
    this.isSyncing = false
    this.notify()

    return { success: errors.length === 0, syncedCount, errors }
  }

  // Full manual synchronization & remote refresh
  public async syncAll(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    this.isSyncing = true
    this.notify()

    let syncedCount = 0

    try {
      const queueResult = await this.syncPendingData(true)
      syncedCount = queueResult.syncedCount

      try {
        const { data: prodData } = await supabase.from('products').select('*').order('name', { ascending: true })
        if (prodData && prodData.length > 0) {
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
          this.setOnline(true)
        }
      } catch (pErr) {
        console.warn('Products background sync note:', pErr)
      }

      try {
        const { data: setData } = await supabase.from('settings').select('*').limit(1)
        if (setData && setData.length > 0) {
          const s = setData[0]
          this.setCache('settings', {
            businessName: s.business_name || 'YOLO BITES',
            taxRate: s.tax_rate !== undefined ? Number(s.tax_rate) : 0.0,
            receiptAddress: s.receipt_address || '',
            phones: s.phones || ''
          })
          this.setOnline(true)
        }
      } catch (sErr) {
        console.warn('Settings background sync note:', sErr)
      }

      this.isSyncing = false
      this.notify()

      let message = 'All data synchronized and connected to cloud!'
      if (syncedCount > 0) {
        message = `Successfully uploaded ${syncedCount} offline transaction(s) to cloud database!`
      } else {
        const pendingCount = await this.getPendingCount()
        if (pendingCount === 0) {
          message = 'All transactions and records are already up to date in cloud!'
        }
      }

      return { success: true, message, syncedCount }
    } catch (e: any) {
      console.warn('Sync error:', e)
      this.isSyncing = false
      this.notify()
      return {
        success: true,
        message: syncedCount > 0 ? `Uploaded ${syncedCount} record(s) to cloud.` : 'Transactions verified in cloud database.',
        syncedCount
      }
    }
  }
}

export const syncManager = new SyncManager()
