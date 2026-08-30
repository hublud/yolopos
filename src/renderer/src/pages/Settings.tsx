import { useState, useEffect } from 'react'
import { Printer, Database, Store, Save, RefreshCw, Users, Key, Plus, X, Shield, Eye, EyeOff } from 'lucide-react'

interface SettingsProps {
  settings: {
    businessName: string
    taxRate: number
    receiptAddress: string
    phones: string
  }
  onSettingsSaved: () => void
}

export function Settings({ settings, onSettingsSaved }: SettingsProps) {
  const [businessName, setBusinessName] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [receiptAddress, setReceiptAddress] = useState('')
  const [phones, setPhones] = useState('')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Staff Management States
  const [cashiersList, setCashiersList] = useState<any[]>([])
  const [showPinModal, setShowPinModal] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState<any>(null)
  const [newPin, setNewPin] = useState('')
  
  const [showAddCashierModal, setShowAddCashierModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPin, setAddPin] = useState('')
  const [addRole, setAddRole] = useState('cashier')

  // Reveal PIN states
  const [revealedPins, setRevealedPins] = useState<{ [key: string]: boolean }>({})

  // Keep state in sync with loaded settings prop
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || 'YOLO BITES')
      setTaxRate(settings.taxRate !== undefined ? Number(settings.taxRate) : 0)
      setReceiptAddress(settings.receiptAddress || '')
      setPhones(settings.phones || '')
    }
  }, [settings])

  useEffect(() => {
    loadCashiers()
  }, [])

  const loadCashiers = async () => {
    try {
      // @ts-ignore
      const data = await window.api.getCashiers()
      setCashiersList(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // @ts-ignore
      const result = await window.api.saveSettings({
        businessName,
        taxRate: Number(taxRate),
        receiptAddress,
        phones
      })

      if (result.success) {
        setSuccess(true)
        onSettingsSaved()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while saving settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCashier || newPin.length !== 4 || isNaN(Number(newPin))) {
      alert("PIN must be exactly 4 digits.")
      return
    }
    setSaving(true)
    try {
      // @ts-ignore
      const result = await window.api.updateCashierPin(selectedCashier.id, newPin)
      if (result.success) {
        setShowPinModal(false)
        setSelectedCashier(null)
        setNewPin('')
        await loadCashiers()
        alert(`PIN updated successfully for ${selectedCashier.name}`)
      } else {
        alert("Failed to update PIN: " + result.error)
      }
    } catch (err) {
      alert("Error updating PIN.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName || addPin.length !== 4 || isNaN(Number(addPin))) {
      alert("PIN must be exactly 4 digits.")
      return
    }
    setSaving(true)
    try {
      // @ts-ignore
      const result = await window.api.addCashier({
        name: addName,
        pin: addPin,
        role: addRole
      })
      if (result.success) {
        setShowAddCashierModal(false)
        setAddName('')
        setAddPin('')
        setAddRole('cashier')
        await loadCashiers()
        alert(`Cashier ${addName} added successfully.`)
      } else {
        alert("Failed to add cashier: " + result.error)
      }
    } catch (err) {
      alert("Error adding cashier.")
    } finally {
      setSaving(false)
    }
  }

  const togglePinReveal = (id: string) => {
    setRevealedPins(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleFactoryReset = async () => {
    const confirm = window.confirm(
      'Are you sure you want to restore default settings and seed data? This will clear all local transactions and inventory additions!'
    )
    if (!confirm) return

    try {
      localStorage.clear()
      alert('Local storage cleared successfully! The application will now reload to re-seed defaults.')
      window.location.reload()
    } catch (err) {
      alert('Failed to reset: ' + (err as Error).message)
    }
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-2xl font-bold text-yolo-dark mb-6">System Settings</h2>
      
      <div className="max-w-3xl flex flex-col gap-6">
        
        {/* Business Settings */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
            <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
              <Store size={20} />
            </div>
            <h3 className="font-bold text-lg text-gray-800">Business Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone Numbers (comma separated)</label>
              <input 
                type="text" 
                value={phones}
                onChange={(e) => setPhones(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Address</label>
              <textarea 
                value={receiptAddress}
                onChange={(e) => setReceiptAddress(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all min-h-[80px]" 
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="text-sm">
              {success && <span className="text-green-600 font-bold flex items-center gap-1">✓ Settings saved successfully!</span>}
              {error && <span className="text-red-600 font-bold">✗ {error}</span>}
            </div>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95 ${
                saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-yolo-red hover:bg-red-700'
              }`}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Staff & Cashier Management Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg text-yolo-red">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Staff PIN Management</h3>
            </div>
            <button 
              onClick={() => setShowAddCashierModal(true)}
              className="bg-yolo-red hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus size={14} />
              Add Staff
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold text-xs">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">PIN / Password</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashiersList.map((cashier: any) => (
                  <tr key={cashier.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-semibold text-gray-800">{cashier.name}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cashier.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Shield size={10} />
                        {cashier.role}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>{revealedPins[cashier.id] ? cashier.pin : '••••'}</span>
                        <button 
                          onClick={() => togglePinReveal(cashier.id)} 
                          className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
                          title={revealedPins[cashier.id] ? "Hide PIN" : "Show PIN"}
                        >
                          {revealedPins[cashier.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedCashier(cashier)
                          setShowPinModal(true)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-200 text-gray-600 hover:text-yolo-red hover:bg-red-50 hover:border-red-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
                      >
                        <Key size={12} />
                        Change PIN
                      </button>
                    </td>
                  </tr>
                ))}
                {cashiersList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">
                      No cashiers loaded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printer Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-500">
              <Printer size={20} />
            </div>
            <h3 className="font-bold text-lg text-gray-800">Receipt Printer</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">Default Printer</p>
              <p className="text-xs text-gray-500 mt-0.5">Select the thermal printer to use for receipts.</p>
            </div>
            <select className="border border-gray-200 text-sm rounded-lg px-3 py-2 bg-white outline-none min-w-[200px] focus:ring-2 focus:ring-yolo-red">
              <option>System Default Printer</option>
              <option>POS-80C Thermal Printer</option>
              <option>Save as PDF</option>
            </select>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
            <div className="bg-red-50 p-2 rounded-lg text-yolo-red">
              <Database size={20} />
            </div>
            <h3 className="font-bold text-lg text-gray-800">Database & Maintenance</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">Local Database</p>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">Stored at: userData/yolobite.db</p>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
              Backup Database
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-medium text-yolo-red text-sm">Danger Zone</p>
              <p className="text-xs text-gray-500 mt-0.5">Clear all transactions and reset data.</p>
            </div>
            <button 
              onClick={handleFactoryReset}
              className="px-4 py-2 bg-red-50 text-yolo-red hover:bg-red-100 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw size={14} />
              Factory Reset
            </button>
          </div>
        </div>

      </div>

      {/* Change PIN Modal */}
      {showPinModal && selectedCashier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => {
                setShowPinModal(false)
                setSelectedCashier(null)
                setNewPin('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yolo-dark mb-2">Change Staff PIN</h3>
            <p className="text-sm text-gray-500 mb-4">Set a new 4-digit PIN for <strong>{selectedCashier.name}</strong></p>
            <form onSubmit={handleUpdatePin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New 4-Digit PIN</label>
                <input 
                  type="text" 
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  placeholder="e.g. 1234"
                  value={newPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewPin(val);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-yolo-red outline-none text-center font-mono text-xl tracking-widest transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={saving || newPin.length !== 4}
                className="bg-yolo-red text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                Update PIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Cashier Modal */}
      {showAddCashierModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => {
                setShowAddCashierModal(false)
                setAddName('')
                setAddPin('')
                setAddRole('cashier')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yolo-dark mb-4">Add Staff Member</h3>
            <form onSubmit={handleAddCashier} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Joy Aliyu"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">4-Digit PIN</label>
                <input 
                  type="text" 
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  placeholder="e.g. 5555"
                  value={addPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAddPin(val);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-center font-mono text-lg tracking-widest transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select 
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all bg-white"
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={saving || addPin.length !== 4 || !addName}
                className="bg-yolo-red text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                Create Staff Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
