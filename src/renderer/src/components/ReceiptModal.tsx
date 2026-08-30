import { X, Printer, Download } from 'lucide-react'
// @ts-ignore
import logoSrc from '../assets/logo.jpeg'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  pos: 'POS (Card)',
  transfer: 'Bank Transfer'
}

export function ReceiptModal({ order, onClose }) {
  if (!order) return null

  const handlePrint = async () => {
    try {
      // @ts-ignore
      if (window.api && window.api.printReceipt) {
        // @ts-ignore
        await window.api.printReceipt()
      } else {
        window.print()
      }
    } catch (e) {
      console.error(e)
      window.print()
    }
  }

  const handleDownload = async () => {
    try {
      // @ts-ignore
      if (window.api && window.api.downloadReceiptPDF) {
        // @ts-ignore
        const res = await window.api.downloadReceiptPDF()
        if (res.success) {
          alert('PDF saved successfully!')
        } else if (res.error && res.error !== 'Save cancelled') {
          alert('Failed to save PDF: ' + res.error)
        }
      } else {
        alert('PDF download is only available in the desktop application.')
      }
    } catch (e) {
      alert('Error generating PDF: ' + (e as Error).message)
    }
  }

  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || 'Cash'

  const businessName = order.settings?.businessName || 'YOLO BITES'
  const receiptAddress = order.settings?.receiptAddress || 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA'
  const phones = order.settings?.phones || '07013974928, 07044030444'
  const taxRate = order.taxRate !== undefined ? order.taxRate : 10

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-transparent print:backdrop-blur-none print:p-0">
      
      {/* Non-printable modal controls */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden">
        <button onClick={handlePrint} className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 shadow-lg" title="Print Receipt">
          <Printer size={20} />
        </button>
        <button onClick={handleDownload} className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 shadow-lg" title="Download PDF">
          <Download size={20} />
        </button>
        <button onClick={onClose} className="bg-yolo-red text-white p-3 rounded-full hover:bg-red-700 shadow-lg ml-4" title="Close">
          <X size={20} />
        </button>
      </div>

      {/* Printable Receipt Area */}
      <div className="bg-white w-[80mm] min-h-[100mm] p-6 shadow-2xl relative Receipt printable-area receipt-to-print">
        
        {/* Header */}
        <div className="flex flex-col items-center border-b border-dashed border-gray-400 pb-4 mb-4 text-center">
          <img src={logoSrc} alt="YOLO BITES" className="w-20 mb-2 grayscale" />
          <h2 className="font-bold text-xl uppercase font-sans tracking-widest">{businessName}</h2>
          <p className="text-[10px] font-sans leading-tight mt-1 whitespace-pre-line">
            {receiptAddress}
          </p>
          <p className="text-[10px] font-sans font-bold mt-1">{phones}</p>
        </div>

        {/* Order Info */}
        <div className="flex flex-col text-[11px] font-mono border-b border-dashed border-gray-400 pb-4 mb-4 gap-1">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Order #:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{order.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment:</span>
            <span className="font-bold uppercase">{paymentLabel}</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-[11px] font-mono mb-4">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left pb-1">Item</th>
              <th className="text-center pb-1">Qty</th>
              <th className="text-right pb-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-1 truncate pr-1">{item.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">₦{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col text-[11px] font-mono border-t border-dashed border-gray-400 pt-4 mb-6 gap-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₦{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({taxRate}%):</span>
            <span>₦{order.tax.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-₦{order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold mt-2 border-t border-gray-300 pt-2">
            <span>TOTAL:</span>
            <span>₦{order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] mt-1 text-gray-600">
            <span>Paid via:</span>
            <span className="font-semibold">{paymentLabel}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center flex flex-col items-center">
          <p className="text-[11px] font-sans font-bold uppercase tracking-wider">Thank you for dining with</p>
          <p className="text-[14px] font-bold mt-1">{businessName}!</p>
          <p className="text-[9px] font-mono mt-4 text-gray-500">Please come again</p>
        </div>
      </div>
    </div>
  )
}
