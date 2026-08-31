import { useState, useEffect } from 'react'
import { api } from '../api'

export function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNumpad = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
      setError('')
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  useEffect(() => {
    if (pin.length === 4) {
      handleLogin()
    }
  }, [pin])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const user = await api.loginPin(pin)
      if (user) {
        onLogin(user)
      } else {
        setError('Invalid PIN')
        setPin('')
      }
    } catch (err) {
      setError('Connection error')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-yolo-red to-orange-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="w-20 h-20 bg-yolo-red rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg z-10">
          YB
        </div>
        <h1 className="text-3xl font-bold text-yolo-dark mb-1 z-10">YOLO BITE</h1>
        <p className="text-gray-500 mb-8 z-10 text-sm">Enter your 4-digit Cashier PIN</p>

        <div className="flex gap-4 mb-8 z-10">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-14 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                pin.length > i 
                  ? 'bg-yolo-red text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-transparent border-2 border-transparent'
              } ${error ? 'animate-bounce bg-red-100 border-red-500' : ''}`}
            >
              {pin.length > i ? '•' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-yolo-red font-medium mb-4 text-sm animate-pulse">{error}</p>}
        {loading && <p className="text-orange-500 font-medium mb-4 text-sm animate-pulse">Verifying...</p>}

        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] z-10">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleNumpad(num)}
              className="w-full aspect-square rounded-2xl bg-gray-50 text-2xl font-semibold text-yolo-dark hover:bg-red-50 hover:text-yolo-red transition-colors active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="w-full aspect-square rounded-2xl bg-gray-50 text-lg font-medium text-gray-500 hover:bg-gray-200 transition-colors active:scale-95 shadow-sm"
          >
            C
          </button>
          <button
            onClick={() => handleNumpad('0')}
            className="w-full aspect-square rounded-2xl bg-gray-50 text-2xl font-semibold text-yolo-dark hover:bg-red-50 hover:text-yolo-red transition-colors active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-full aspect-square rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors active:scale-95 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
