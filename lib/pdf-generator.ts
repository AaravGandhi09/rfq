import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      // Load logo and stamp from URLs
      const logoUrl = 'https://thumbs2.imgbox.com/4e/85/pGS8V6Op_t.png'
      const stampUrl = 'https://thumbs2.imgbox.com/db/91/h7Asx5WS_t.png'

      // Add logo to header (top-left)
      try {
        doc.addImage(logoUrl, 'PNG', 15, y, 40, 15); // Directly use logoUrl
      } catch (err) {
        console.log('Logo load failed, continuing without logo');
      }

      // Header - Company Name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('TULSI MARKETING', 105, y + 5, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Shop No.4, Govind Nagar, S.No.50/1/2, Karve Road, Pune - 411004', 105, y + 12, {
        align: 'center'
      })

      y += 25

      // Quotation Details
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('QUOTATION', 15, y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Quote #: ${data.quoteId}`, 15, y + 7)
      doc.text(`Date: ${data.date}`, 15, y + 12)
      doc.text(`Valid Until: ${data.validUntil}`, 15, y + 17)

      // Company Details (Right side)
      doc.text(`PAN: AAHFT9063B`, 150, y + 7)
      doc.text(`GSTIN: 27AAHFT9063B1ZH`, 150, y + 12)

      y += 30

      // Customer Details
      doc.setFont('helvetica', 'bold')
      doc.text('Bill To:', 15, y)
      doc.text('Ship To:', 105, y)

      doc.setFont('helvetica', 'normal')
      doc.text(data.customerName, 15, y + 5)
      doc.text(data.customerEmail, 15, y + 10)

      doc.text(data.customerName, 105, y + 5)
      doc.text(data.customerEmail, 105, y + 10)

      y += 30

      // Items Table
      const tableData = data.matchedItems.map((item) => {
        const rate = item.unitPrice || 0
        const cgst = rate * 0.09
        const sgst = rate * 0.09
        const amount = item.total || 0

        return [
          item.productName,
          item.hsnCode || '-',
          item.quantity.toString(),
          rate.toFixed(2),
          cgst.toFixed(2),
          sgst.toFixed(2),
          amount.toFixed(2)
        ]
      })

      autoTable(doc, {
        startY: y,
        head: [['Description', 'HSN', 'Qty', 'Rate', 'CGST (9%)', 'SGST (9%)', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [243, 243, 243],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'  // Center all cells
        },
        columnStyles: {
          0: { cellWidth: 60, halign: 'left' },  // Description left-aligned
          1: { cellWidth: 25, halign: 'center' }, // HSN centered
          2: { cellWidth: 15, halign: 'center' }, // Qty centered
          3: { cellWidth: 25, halign: 'right' },  // Rate right-aligned
          4: { cellWidth: 25, halign: 'right' },  // CGST right-aligned
          5: { cellWidth: 25, halign: 'right' },  // SGST right-aligned
          6: { cellWidth: 25, halign: 'right' }   // Amount right-aligned
        },
        didParseCell: function (data) {
          // Remove any currency symbols from the parsed data to avoid jsPDF issues
          if (data.cell.section === 'body' && data.column.index >= 3 && data.cell.raw) {
            data.cell.text = [data.cell.raw.toString()]
          }
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

      y += 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('For TULSI MARKETING', 150, y)

      // Add stamp (signature area)
      try {
        doc.addImage(stampUrl, 'PNG', 155, y + 5, 25, 25)
      } catch (err) {
        console.log('Stamp load failed, continuing without stamp')
      }

      y += 35
      // Footer
      y = doc.internal.pageSize.getHeight() - 20
      doc.setFontSize(8)
      doc.text('LUT: AD2904230038263 / UDYAM-KR-03-0067698', 20, y)
      y += 4
      doc.text('Email: sales@tulsimarketing.com | Phone: +91-80-41510775', 20, y)

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      resolve(pdfBuffer)
    } catch (error: any) {
      console.error('PDF generation error:', error)
      reject(error)
    }
  })
}

function calculateTax(subtotal: number) {
  const cgst = subtotal * 0.09 // 9% CGST
  const sgst = subtotal * 0.09 // 9% SGST
  const total = subtotal + cgst + sgst
  return { cgst, sgst, total }
}
