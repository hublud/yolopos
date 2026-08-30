import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { syncManager } from '../services/syncManager'

export function NetworkSyncBar() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((online, pending) => {
      setIsOnline(online)
      setPendingCount(pending)
      setIsSyncing(syncManager.getNetworkStatus().isSyncing)
    })
    return () => unsubscribe()
  }, [])

  const handleManualSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setNotification({
      type: 'info',
      message: 'Syncing with Supabase cloud database...'
    })

    const result = await syncManager.syncAll()
    setIsSyncing(false)

    if (result.success) {
      setNotification({
        type: 'success',
        message: result.message || 'All data synchronized and up to date!'
      })
    } else {
      setNotification({
        type: 'error',
        message: result.message || 'Could not connect to cloud. Saved locally.'
      })
    }

    setTimeout(() => {
      setNotification(prev => (prev?.type !== 'info' ? null : prev))
    }, 5000)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all duration-300 border backdrop-blur-md animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-900/20' 
            : notification.type === 'error'
              ? 'bg-red-600/95 text-white border-red-500 shadow-red-900/20'
              : 'bg-yolo-dark/95 text-white border-gray-700 shadow-black/30'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={18} className="text-emerald-200 shrink-0" />}
          {notification.type === 'error' && <AlertCircle size={18} className="text-red-200 shrink-0" />}
          {notification.type === 'info' && <RefreshCw size={18} className="animate-spin text-yolo-orange shrink-0" />}
          
          <span className="leading-snug">{notification.message}</span>

          <button 
            onClick={() => setNotification(null)}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Online Status Badge (Clickable to re-check) */}
      <button 
        type="button"
        onClick={handleManualSync}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border select-none cursor-pointer hover:shadow-sm active:scale-95 ${
          isOnline 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70' 
            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
        }`}
        title={isOnline ? 'Connected to Supabase Cloud. Click to sync.' : 'Offline mode. Click to retry connection.'}
      >
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </span>
        {isOnline ? (
          <>
            <Wifi size={13} />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff size={13} />
            <span>Offline</span>
          </>
        )}
      </button>

      {/* Synchronize Button with active animation and pending count */}
      {pendingCount > 0 ? (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 border bg-orange-500 hover:bg-orange-600 text-white border-orange-600 cursor-pointer"
          title="Click to synchronize pending items to cloud"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          <span>
            {isSyncing ? 'Syncing...' : `${pendingCount} Pending Sync`}
          </span>
        </button>
      ) : (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`inline-flex items-center justify-center p-2 rounded-full border transition-all text-xs active:scale-90 ${
            isSyncing 
              ? 'bg-yolo-cream text-yolo-orange border-orange-200 shadow-inner' 
              : 'bg-white text-gray-500 hover:text-yolo-dark hover:bg-gray-50 border-gray-200 shadow-sm'
          }`}
          title="Synchronize data with cloud"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin text-yolo-orange' : ''} />
        </button>
      )}
    </div>
  )
}
