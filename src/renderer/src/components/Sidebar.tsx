import { LayoutDashboard, ShoppingCart, Package, Users, Settings as SettingsIcon, LogOut } from 'lucide-react'

export function Sidebar({ currentTab, setTab, onLogout, role }: { currentTab: string; setTab: (t: string) => void; onLogout: () => void; role?: string }) {
  const tabs = [
    { id: 'pos', icon: ShoppingCart, label: 'POS' },
    ...(role === 'admin' ? [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'inventory', icon: Package, label: 'Inventory' },
      { id: 'customers', icon: Users, label: 'Customers' },
      { id: 'settings', icon: SettingsIcon, label: 'Settings' }
    ] : [])
  ]

  return (
    <aside className="hidden md:flex w-24 bg-white border-r border-gray-200 flex-col items-center py-6 h-screen shrink-0 z-30">
      <div className="w-12 h-12 bg-yolo-red rounded-2xl flex items-center justify-center text-white font-black text-xl mb-8 shadow-lg shadow-red-200">
        YB
      </div>
      
      <div className="flex flex-col gap-4 flex-1 w-full px-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                isActive 
                  ? 'bg-yolo-red text-white shadow-md shadow-red-100' 
                  : 'text-gray-500 hover:bg-red-50 hover:text-yolo-red'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1 tracking-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <button 
        onClick={onLogout}
        title="Log out"
        className="text-gray-400 hover:text-yolo-red hover:bg-red-50 p-3 rounded-2xl flex flex-col items-center transition-all active:scale-95"
      >
        <LogOut size={22} />
        <span className="text-[10px] font-bold mt-1">Logout</span>
      </button>
    </aside>
  )
}

export function MobileBottomNav({ currentTab, setTab, role }: { currentTab: string; setTab: (t: string) => void; role?: string }) {
  const tabs = [
    { id: 'pos', icon: ShoppingCart, label: 'POS' },
    ...(role === 'admin' ? [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'inventory', icon: Package, label: 'Inventory' },
      { id: 'customers', icon: Users, label: 'Customers' },
      { id: 'settings', icon: SettingsIcon, label: 'Settings' }
    ] : [])
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/90 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all flex-1 ${
              isActive 
                ? 'text-yolo-red font-black scale-105' 
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-red-50 text-yolo-red' : ''}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-yolo-red' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
