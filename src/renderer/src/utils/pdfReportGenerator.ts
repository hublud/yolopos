import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ReportOrderItem {
  productId?: string
  name: string
  category?: string
  variantName?: string
  quantity: number
  price: number
}

export interface ReportOrder {
  id: string
  orderNumber: string
  total: number
  discount?: number
  tax?: number
  status?: string
  paymentMethod?: string
  cashierName?: string
  customerName?: string
  createdAt: number | string
  items?: ReportOrderItem[]
}

export interface ReportSettings {
  businessName?: string
  receiptAddress?: string
  phones?: string
}

export interface ReportOptions {
  periodLabel: string
  dateRangeText: string
  orders: ReportOrder[]
  settings?: ReportSettings
  generatedBy?: string
}

export function generatePdfReport(options: ReportOptions) {
  const { periodLabel, dateRangeText, orders, settings, generatedBy = 'Admin' } = options

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  const formatCurrency = (num: number) => {
    return 'NGN ' + (num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '-'
    const num = Number(timestamp)
    const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(timestamp)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ── Metrics Calculation ──────────────────────────────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const totalOrders = orders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  let totalItemsSold = 0
  const itemMap: { [key: string]: { name: string; category: string; quantity: number; revenue: number } } = {}

  let cashRevenue = 0
  let cashOrders = 0
  let posRevenue = 0
  let posOrders = 0
  let transferRevenue = 0
  let transferOrders = 0

  orders.forEach(order => {
    const pMethod = String(order.paymentMethod || 'cash').toLowerCase()
    const amt = Number(order.total) || 0

    if (pMethod === 'cash') {
      cashRevenue += amt
      cashOrders++
    } else if (pMethod.includes('pos') || pMethod.includes('card')) {
      posRevenue += amt
      posOrders++
    } else {
      transferRevenue += amt
      transferOrders++
    }

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(it => {
        const key = it.name || 'Unknown Item'
        const q = Number(it.quantity) || 1
        const p = Number(it.price) || 0
        totalItemsSold += q

        if (!itemMap[key]) {
          itemMap[key] = {
            name: it.name || 'Item',
            category: it.category || 'Mains',
            quantity: 0,
            revenue: 0
          }
        }
        itemMap[key].quantity += q
        itemMap[key].revenue += q * p
      })
    }
  })

  const topItems = Object.values(itemMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  // ── 1. Top Decorative Brand Bar & Header ─────────────────────────────────
  doc.setFillColor(185, 28, 28) // YOLO Brand Crimson
  doc.rect(0, 0, pageWidth, 6, 'F')

  // Business Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 41, 59)
  doc.text(settings?.businessName || 'YOLO BITES RESTAURANT & BAR', margin, 18)

  // Subtitle / Report Name
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(185, 28, 28)
  doc.text('OFFICIAL SALES & FINANCIAL REPORT', margin, 24)

  // Address & Phone lines (right side)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const phoneText = `Tel: ${settings?.phones || '07013974928, 07044030444'}`
  doc.text(phoneText, pageWidth - margin, 18, { align: 'right' })
  const addressLine = settings?.receiptAddress ? settings.receiptAddress.split('\n')[0] : 'Shop G9, A.M Store Aliyu Makama Road'
  doc.text(addressLine, pageWidth - margin, 22, { align: 'right' })
  doc.text('Barnawa, Kaduna State, Nigeria', pageWidth - margin, 26, { align: 'right' })

  // Horizontal divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(margin, 29, pageWidth - margin, 29)

  // ── 2. Report Metadata Box ───────────────────────────────────────────────
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, 32, pageWidth - (margin * 2), 16, 2, 2, 'FD')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('REPORT PERIOD:', margin + 4, 38)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(`${periodLabel.toUpperCase()} (${dateRangeText})`, margin + 33, 38)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('GENERATED ON:', margin + 4, 44)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(formatDateTime(Date.now()), margin + 33, 44)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('GENERATED BY:', pageWidth - margin - 52, 38)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(generatedBy, pageWidth - margin - 22, 38)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('TOTAL RECORDS:', pageWidth - margin - 52, 44)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(`${totalOrders} Orders`, pageWidth - margin - 22, 44)

  // ── 3. Executive KPI Cards ───────────────────────────────────────────────
  const startY = 52
  const cardWidth = (pageWidth - (margin * 2) - 9) / 4
  const cardHeight = 19

  const kpis = [
    { title: 'TOTAL REVENUE', value: formatCurrency(totalRevenue), color: [16, 185, 129] },
    { title: 'TOTAL SALES ORDERS', value: totalOrders.toString(), color: [59, 130, 246] },
    { title: 'AVERAGE ORDER VALUE', value: formatCurrency(averageOrderValue), color: [168, 85, 247] },
    { title: 'TOTAL ITEMS SOLD', value: totalItemsSold.toString(), color: [239, 68, 68] }
  ]

  kpis.forEach((kpi, idx) => {
    const x = margin + (idx * (cardWidth + 3))
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'FD')

    // Top color strip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.rect(x, startY, cardWidth, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text(kpi.title, x + (cardWidth / 2), startY + 6.5, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(kpi.value, x + (cardWidth / 2), startY + 14.5, { align: 'center' })
  })

  // ── 4. Payment Modes Breakdown Bar ───────────────────────────────────────
  const pY = startY + cardHeight + 4
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, pY, pageWidth - (margin * 2), 11, 2, 2, 'FD')

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('PAYMENT METHODS BREAKDOWN:', margin + 4, pY + 7)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  const cashText = `Cash: ${formatCurrency(cashRevenue)} (${cashOrders})`
  const posText = `POS/Card: ${formatCurrency(posRevenue)} (${posOrders})`
  const transferText = `Transfer: ${formatCurrency(transferRevenue)} (${transferOrders})`
  doc.text(`${cashText}   |   ${posText}   |   ${transferText}`, margin + 55, pY + 7)

  // ── 5. Top Selling Items Table (if any) ──────────────────────────────────
  let currentY = pY + 16

  if (topItems.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 41, 59)
    doc.text('Top Selling Menu Items & Beverages', margin, currentY)

    const topItemsHead = [['Rank', 'Item Name', 'Category', 'Qty Sold', 'Revenue (NGN)', '% of Sales']]
    const topItemsBody = topItems.map((it, idx) => {
      const share = totalRevenue > 0 ? ((it.revenue / totalRevenue) * 100).toFixed(1) + '%' : '0%'
      return [
        `#${idx + 1}`,
        it.name,
        it.category || 'Mains',
        it.quantity.toString(),
        (it.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        share
      ]
    })

    autoTable(doc, {
      startY: currentY + 2,
      head: topItemsHead,
      body: topItemsBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        1: { cellWidth: 60, fontStyle: 'bold' },
        2: { cellWidth: 35 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right' }
      },
      margin: { left: margin, right: margin }
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // ── 6. Full Transaction Log Table ────────────────────────────────────────
  if (currentY > pageHeight - 40) {
    doc.addPage()
    currentY = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(30, 41, 59)
  doc.text('Detailed Sales Transaction Log', margin, currentY)

  const transactionsHead = [['Order #', 'Date & Time', 'Cashier', 'Payment', 'Items Summary', 'Total (NGN)']]
  const transactionsBody = orders.map(order => {
    const itemsSummary = (order.items || [])
      .map(it => `${it.quantity}x ${it.name}${it.variantName ? ' (' + it.variantName + ')' : ''}`)
      .join(', ') || 'General Order'

    const paymentText = (order.paymentMethod || 'Cash').toUpperCase()

    return [
      `#${order.orderNumber || order.id.substring(0, 6)}`,
      formatDateTime(order.createdAt),
      order.cashierName || 'Staff',
      paymentText,
      itemsSummary.length > 50 ? itemsSummary.substring(0, 47) + '...' : itemsSummary,
      (Number(order.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ]
  })

  autoTable(doc, {
    startY: currentY + 2,
    head: transactionsHead,
    body: transactionsBody.length > 0 ? transactionsBody : [['-', '-', '-', '-', 'No transactions recorded in this period', '0.00']],
    theme: 'striped',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [51, 65, 85],
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 22 },
      3: { cellWidth: 20 },
      4: { cellWidth: 55 },
      5: { halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin, bottom: 18 },
    didDrawPage: (data) => {
      // Add running footer on each page
      const pageCount = doc.getNumberOfPages()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `YOLO BITES POS System Report  |  Confidential & Internal Use Only  |  Generated on ${new Date().toLocaleDateString()}`,
        margin,
        pageHeight - 8
      )
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      )
    }
  })

  // ── 7. Save / Trigger Download ───────────────────────────────────────────
  const filenameDate = new Date().toISOString().substring(0, 10)
  const cleanLabel = periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const filename = `YOLO_BITES_Report_${cleanLabel}_${filenameDate}.pdf`

  doc.save(filename)
  return filename
}
