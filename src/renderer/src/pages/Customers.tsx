import { useState, useEffect } from 'react'
import { Search, Plus, Star, X } from 'lucide-react'
import { api } from '../api'

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers()
      setCustomers(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return
    setLoading(true)
    try {
      const result = await api.addCustomer({ name, phone })
      if (result.success) {
        setName('')
        setPhone('')
        setShowModal(false)
        await loadCustomers()
      } else {
        alert('Failed to add customer: ' + result.error)
      }
    } catch (err) {
      alert('Error adding customer.')
    }
    setLoading(false)
  }

  const filteredCustomers = customers.filter((c: any) => 
    (c?.name || '').toLowerCase().includes((search || '').toLowerCase()) || 
    String(c?.phone || '').includes(search)
  )

  return (
    <div className="p-3.5 sm:p-6 md:p-8 h-full flex flex-col relative bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-yolo-dark">Customers</h2>
          <p className="text-xs sm:text-sm text-gray-500">Manage customer loyalty points and contact directory</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-yolo-red text-white px-3.5 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-red-700 transition-colors shadow-sm self-start sm:self-auto active:scale-95"
        >
          <Plus size={16} />
          New Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search customers by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yolo-red focus:border-transparent text-xs sm:text-sm transition-all bg-gray-50/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Desktop Table View */}
          <table className="hidden sm:table w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Phone Number</th>
                <th className="px-6 py-3.5">Loyalty Points</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredCustomers.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">{c.phone}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1 font-bold text-orange-500">
                      <Star size={16} className="fill-orange-500" />
                      {c.loyalty_points || c.loyaltyPoints || 0} pts
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-gray-100 p-2">
            {filteredCustomers.map((c: any) => (
              <div key={c.id} className="py-3 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-yolo-red flex items-center justify-center font-bold text-xs shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-800 truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-bold text-xs text-orange-500 shrink-0 ml-2 bg-orange-50 px-2 py-1 rounded-lg">
                  <Star size={12} className="fill-orange-500" />
                  <span>{c.loyalty_points || c.loyaltyPoints || 0} pts</span>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-xs">
              No customers found.
            </div>
          )}
        </div>
      </div>

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yolo-dark mb-4">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 07013974928"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-yolo-red text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
