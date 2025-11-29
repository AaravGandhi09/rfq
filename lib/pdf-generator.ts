import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface QuoteItem {
  productName: string
  quantity: number
  specifications?: string
  isMatched: boolean
  unitPrice?: number
  total?: number
  hsnCode?: string
}

interface QuoteData {
  quoteId: string
  customerName: string
  customerEmail: string
  companyName?: string
  customerGstin?: string
  billingAddress?: string
  shippingAddress?: string
  matchedItems: QuoteItem[]
  unmatchedItems: QuoteItem[]
  subtotal: number
  date: string
  validUntil: string
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  const crores = Math.floor(num / 10000000)
  const lakhs = Math.floor((num % 10000000) / 100000)
  const thousands = Math.floor((num % 100000) / 1000)
  const hundreds = Math.floor((num % 1000) / 100)
  const remainder = num % 100

  let words = ''

  if (crores > 0) words += ones[crores] + ' Crore '
  if (lakhs > 0) words += (lakhs < 10 ? ones[lakhs] : (lakhs >= 10 && lakhs < 20 ? teens[lakhs - 10] : tens[Math.floor(lakhs / 10)] + ' ' + ones[lakhs % 10])) + ' Lakh '
  if (thousands > 0) words += (thousands < 10 ? ones[thousands] : (thousands >= 10 && thousands < 20 ? teens[thousands - 10] : tens[Math.floor(thousands / 10)] + ' ' + ones[thousands % 10])) + ' Thousand '
  if (hundreds > 0) words += ones[hundreds] + ' Hundred '
  if (remainder > 0) {
    if (remainder < 10) words += ones[remainder]
    else if (remainder < 20) words += teens[remainder - 10]
    else words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10]
  }

  return 'Indian Rupee ' + words.trim() + ' Only'
}

export async function generateQuotePDF(data: QuoteData): Promise<Buffer> {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 15

    // Header - Company Info & Logo placeholder
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('TULSI MARKETING', 20, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('485, Chinmaya Mission Hospital Rd, Indiranagar 1st Stage', 20, y)
    y += 4
    doc.text('Bengaluru- 560038', 20, y)

    // Quotation Title (right side)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Quotation', pageWidth - 20, 15, { align: 'right' })

    // Quote Details (right side)
    y = 25
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Quotation No: ${data.quoteId}`, pageWidth - 20, y, { align: 'right' })
    y += 5
    doc.text(`Date: ${data.date}`, pageWidth - 20, y, { align: 'right' })
    y += 5
    doc.text(`Expiry: ${data.validUntil}`, pageWidth - 20, y, { align: 'right' })
    y += 7
    doc.text('PAN: AAZPL3421B | GSTIN: 29AAZPL3421B1ZM', pageWidth - 20, y, { align: 'right' })

    y = 50

    // Bill To & Ship To
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To', 20, y)
    doc.text('Ship To', 110, y)

    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const billTo = `${data.customerName}\n${data.companyName || ''}\n${data.billingAddress || ''}\n${data.customerGstin ? 'GSTIN: ' + data.customerGstin : ''}`
    const shipTo = data.shippingAddress || data.billingAddress || ''

    doc.text(billTo, 20, y, { maxWidth: 85 })
    doc.text(shipTo, 110, y, { maxWidth: 85 })

    y += 30

    // Items Table
    const tableData = data.matchedItems.map((item, index) => {
      const rate = item.unitPrice || 0
      const cgst = rate * 0.09
      const sgst = rate * 0.09
      const amount = item.total || 0

      return [
        item.productName,
        item.hsnCode || '-',
        item.quantity.toString(),
        `₹${rate.toFixed(2)}`,
        `₹${cgst.toFixed(2)}`,
        `₹${sgst.toFixed(2)}`,
        `₹${amount.toFixed(2)}`
      ]
    })

      ; (doc as any).autoTable({
        startY: y,
        head: [['Description', 'HSN', 'Qty', 'Rate', 'CGST (9%)', 'SGST (9%)', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [243, 243, 243], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' }
        }
      })

    y = (doc as any).lastAutoTable.finalY + 10

    // Summary
    const { cgst, sgst, total } = calculateTax(data.subtotal)
    const summaryX = pageWidth - 70

    doc.setFontSize(9)
    doc.text('Sub Total:', summaryX, y)
    doc.text(`₹${data.subtotal.toFixed(2)}`, pageWidth - 20, y, { align: 'right' })
    y += 5
    doc.text('CGST (9%):', summaryX, y)
    doc.text(`₹${cgst.toFixed(2)}`, pageWidth - 20, y, { align: 'right' })
    y += 5
    doc.text('SGST (9%):', summaryX, y)
    doc.text(`₹${sgst.toFixed(2)}`, pageWidth - 20, y, { align: 'right' })
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Total:', summaryX, y)
    doc.text(`₹${total.toFixed(2)}`, pageWidth - 20, y, { align: 'right' })

    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const totalWords = numberToWords(Math.floor(total))
    doc.text(`Total In Words: ${totalWords}`, 20, y, { maxWidth: pageWidth - 40 })

    y += 15

    // Terms & Conditions
    doc.setFont('helvetica', 'bold')
    doc.text('Terms & Conditions', 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('* PO to be raised in name of "Tulsi Marketing".', 20, y)
    y += 4
    doc.text('* Quote validity: 30 days.', 20, y)
    y += 4
    doc.text('* Delivery against confirmed PO only.', 20, y)
    y += 4
    doc.text('* Payment terms as per agreed terms.', 20, y)

    // Authorized Signature
    doc.setFontSize(9)
    doc.text('Authorized Signature', pageWidth - 50, y + 10, { align: 'center' })

    // Footer
    y = doc.internal.pageSize.getHeight() - 20
    doc.setFontSize(8)
    doc.text('LUT: AD2904230038263 / UDYAM-KR-03-0067698', 20, y)
    y += 4
    doc.text('Tulsi Marketing — GSTIN 29AAZPL3421B1ZM | PAN: AAZPL3421B', 20, y)

    // Convert to Buffer
    const pdfArrayBuffer = doc.output('arraybuffer')
    return Buffer.from(pdfArrayBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}

function calculateTax(subtotal: number) {
  const cgst = subtotal * 0.09 // 9% CGST
  const sgst = subtotal * 0.09 // 9% SGST
  const total = subtotal + cgst + sgst
  return { cgst, sgst, total }
}
