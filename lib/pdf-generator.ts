import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

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

export async function generateQuotePDF(quoteData: QuoteData): Promise<Buffer> {
  let browser = null
  try {
    // Use serverless Chrome for Vercel
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()
    const html = generateQuoteHTML(quoteData)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      }
    })

    return Buffer.from(pdf)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function calculateTax(subtotal: number) {
  const cgst = subtotal * 0.09 // 9% CGST
  const sgst = subtotal * 0.09 // 9% SGST
  const total = subtotal + cgst + sgst
  return { cgst, sgst, total }
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (num === 0) return 'Zero'

  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const hundred = Math.floor((num % 1000) / 100)
  const remainder = num % 100

  let words = ''

  if (crore > 0) words += numberToWords(crore) + ' Crore '
  if (lakh > 0) words += numberToWords(lakh) + ' Lakh '
  if (thousand > 0) words += numberToWords(thousand) + ' Thousand '
  if (hundred > 0) words += ones[hundred] + ' Hundred '

  if (remainder >= 20) {
    words += tens[Math.floor(remainder / 10)] + ' '
    if (remainder % 10 > 0) words += ones[remainder % 10]
  } else if (remainder >= 10) {
    words += teens[remainder - 10]
  } else if (remainder > 0) {
    words += ones[remainder]
  }

  return words.trim() + ' Rupees Only'
}

function generateQuoteHTML(data: QuoteData): string {
  const { quoteId, customerName, companyName, customerGstin, billingAddress, shippingAddress, matchedItems, date, validUntil } = data

  const { cgst, sgst, total } = calculateTax(data.subtotal)
  const totalInWords = numberToWords(Math.round(total))

  // Image URLs
  const logoUrl = '/images/tulsi-logo.png'
  const stampUrl = '/images/tulsi-stamp.png'

  // Format customer addresses
  const billTo = `${companyName || customerName}${customerGstin ? '\nGSTIN: ' + customerGstin : ''}${billingAddress ? '\n' + billingAddress : ''}`
  const shipTo = shippingAddress || billingAddress || 'Same as Billing Address'

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Quotation - Tulsi Marketing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --page-width: 210mm;
      --page-height: 297mm;
      --pad: 12mm;
      --border: #bdbdbd;
      font-family: Arial, Helvetica, sans-serif;
      color: #222;
    }

    .quote-root {
      width: calc(var(--page-width) - 2 * var(--pad));
      margin: 12mm auto;
      padding: 10px;
      background: white;
      font-size: 12px;
    }

    header { 
      display:flex; 
      justify-content:space-between; 
      gap:12px; 
      align-items:flex-start; 
    }

    header img {
      height: 68px;
      object-fit: contain;
    }

    h1 {
      font-size: 18px;
      margin: 0;
    }

    .meta {
      text-align:right;
      font-size:12px;
    }

    .addresses {
      display:flex;
      gap:12px;
      margin-top:10px;
    }

    .addr {
      flex:1;
      border:1px solid var(--border);
      padding:8px;
      min-height:84px;
      white-space:pre-line;
    }

    table.items {
      width:100%;
      border-collapse:collapse;
      margin-top:10px;
    }

    table.items th,
    table.items td {
      border:1px solid #d6d6d6;
      padding:6px 8px;
    }

    table.items th {
      background:#f3f3f3;
      font-weight:600;
    }

    .right { text-align:right; }

    .summary {
      margin-top:8px;
      width:320px;
      float:right;
      border:1px solid var(--border);
    }

    .summary td {
      border-bottom:1px solid #eee;
      padding:6px 8px;
    }

    .summary tr.total td {
      font-weight:700;
      font-size:14px;
    }

    footer {
      clear:both;
      margin-top:22px;
      border-top:1px dashed #ddd;
      padding-top:10px;
      font-size:11px;
    }

    @media print {
      body { margin:0; -webkit-print-color-adjust:exact; }
      .quote-root { margin:0; width:100%; }
    }
  </style>
</head>
<body>
  <div class="quote-root">

    <!-- HEADER -->
    <header>
      <div style="display:flex; flex-direction:column;">
        <img src="${logoUrl}" alt="Tulsi Marketing Logo" />
        <div style="margin-top:6px; font-size:11px;">
          <strong>TULSI MARKETING</strong><br/>
          485, Chinmaya Mission Hospital Rd, Indiranagar 1st Stage, Bengaluru- 560038
        </div>
        <div style="margin-top:6px">
          PAN: <strong>AAZPL3421B</strong> | GSTIN: <strong>29AAZPL3421B1ZM</strong>
        </div>
      </div>

      <div class="meta">
        <h1>QUOTATION</h1>
        <div>Quotation No: <strong>${quoteId}</strong></div>
        <div>Date: <strong>${date}</strong></div>
        <div>Expiry: <strong>${validUntil}</strong></div>
      </div>
    </header>

    <!-- BILL / SHIP -->
    <div class="addresses">
      <div class="addr">
        <strong>Bill To</strong><br/>
        ${billTo}
      </div>
      <div class="addr">
        <strong>Ship To</strong><br/>
        ${shipTo}
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <table class="items">
      <thead>
        <tr>
          <th style="width:35%;">Description</th>
          <th>HSN</th>
          <th>Qty</th>
          <th class="right">Rate</th>
          <th class="right">CGST (9%)</th>
          <th class="right">SGST (9%)</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${matchedItems.map(item => {
    const itemCgst = (item.unitPrice || 0) * item.quantity * 0.09
    const itemSgst = (item.unitPrice || 0) * item.quantity * 0.09
    return `
            <tr>
              <td>${item.productName}${item.specifications ? '<br/><small>' + item.specifications + '</small>' : ''}</td>
              <td>${item.hsnCode || '-'}</td>
              <td>${item.quantity}</td>
              <td class="right">₹${(item.unitPrice || 0).toFixed(2)}</td>
              <td class="right">₹${itemCgst.toFixed(2)}</td>
              <td class="right">₹${itemSgst.toFixed(2)}</td>
              <td class="right">₹${(item.total || 0).toFixed(2)}</td>
            </tr>
          `
  }).join('')}
      </tbody>
    </table>

    <!-- SUMMARY -->
    <div class="summary">
      <table>
        <tbody>
          <tr><td>Sub Total</td><td class="right">₹${data.subtotal.toFixed(2)}</td></tr>
          <tr><td>CGST (9%)</td><td class="right">₹${cgst.toFixed(2)}</td></tr>
          <tr><td>SGST (9%)</td><td class="right">₹${sgst.toFixed(2)}</td></tr>
          <tr class="total"><td>Total</td><td class="right">₹${total.toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>

    <p style="clear:both; margin-top:14px">
      <strong>Total In Words:</strong> ${totalInWords}
    </p>

    <!-- FOOTER -->
    <footer>
      <div style="display:flex; justify-content:space-between;">
        <div style="max-width:65%;">
          <div style="font-weight:700">Terms & Conditions</div>
          <div>
            * PO to be raised in name of "Tulsi Marketing".<br/>
            * Quote validity: 30 days.<br/>
            * Delivery against confirmed PO only.
          </div>
        </div>

        <div style="text-align:center;">
          <div style="margin-bottom:6px">Authorized Signature</div>
          <div style="display:inline-block; border:1px solid #d0d0d0; padding:8px;">
            <img src="${stampUrl}" alt="Company Stamp" style="width:60px; opacity:0.45" />
          </div>
        </div>
      </div>

      <div style="margin-top:8px; font-size:11px;">
        <div>LUT: / UDYAM-KR-03-0067698AD2904230038263</div>
        Tulsi Marketing — GSTIN 29AAZPL3421B1ZM | PAN: AAZPL3421B
      </div>
    </footer>

  </div>
</body>
</html>
  `
}
