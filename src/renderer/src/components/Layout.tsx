import { Sidebar } from './Sidebar'
import { NetworkSyncBar } from './NetworkSyncBar'

export function Layout({ children, currentTab, setTab, cashier, onLogout }) {
  return (
    <div className="flex h-screen w-full bg-yolo-cream text-yolo-dark overflow-hidden">
      <Sidebar currentTab={currentTab} setTab={setTab} onLogout={onLogout} role={cashier?.role} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">{currentTab}</h1>
            <p className="text-sm text-gray-500 font-medium">Welcome back, {cashier?.name}</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Live Network & Cloud Sync Status */}
            <NetworkSyncBar />
            
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                {cashier?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{cashier?.name || 'User'}</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">{cashier?.role || 'Staff'}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}

