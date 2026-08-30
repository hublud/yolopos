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
    <div className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-6 h-screen shrink-0">
      <div className="w-12 h-12 bg-yolo-red rounded-full flex items-center justify-center text-white font-bold text-xl mb-8 shadow-lg">
        YB
      </div>
      
      <div className="flex flex-col gap-6 flex-1 w-full px-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-yolo-red text-white shadow-md' 
                  : 'text-gray-500 hover:bg-red-50 hover:text-yolo-red'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <button 
        onClick={onLogout}
        className="text-gray-400 hover:text-yolo-red p-3 flex flex-col items-center transition-colors"
      >
        <LogOut size={24} />
        <span className="text-[10px] font-medium mt-1">Logout</span>
      </button>
    </div>
  )
}
