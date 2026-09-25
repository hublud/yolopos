import { Sidebar, MobileBottomNav } from './Sidebar'
import { NetworkSyncBar } from './NetworkSyncBar'
import { LogOut } from 'lucide-react'

export function Layout({ children, currentTab, setTab, cashier, onLogout }: any) {
  return (
    <div className="flex h-screen w-full bg-yolo-cream text-yolo-dark overflow-hidden flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} setTab={setTab} onLogout={onLogout} role={cashier?.role} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-16 md:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Brand Badge */}
            <div className="md:hidden w-9 h-9 bg-yolo-red rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-200 shrink-0">
              YB
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-tight capitalize text-yolo-dark leading-tight">{currentTab}</h1>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium truncate max-w-[140px] sm:max-w-none">
                <span className="hidden sm:inline">Welcome back, </span>{cashier?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {/* Live Network & Cloud Sync Status */}
            <NetworkSyncBar />
            
            {/* User Profile Info */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 pl-2 sm:pl-4 md:pl-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs md:text-sm shrink-0">
                {cashier?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs md:text-sm font-bold truncate max-w-[100px]">{cashier?.name || 'User'}</span>
                <span className="text-[10px] md:text-[11px] text-gray-500 uppercase tracking-wider">{cashier?.role || 'Staff'}</span>
              </div>

              {/* Mobile quick logout button */}
              <button
                onClick={onLogout}
                title="Logout"
                className="md:hidden p-1.5 text-gray-400 hover:text-yolo-red hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} setTab={setTab} role={cashier?.role} />
    </div>
  )
}

