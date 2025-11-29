import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendQuoteEmail({
    to,
    customerName,
    quoteId,
    pdfBuffer,
}: {
    to: string
    customerName: string
    quoteId: string
    pdfBuffer: Buffer
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: `${process.env.COMPANY_NAME || 'Company'} <onboarding@resend.dev>`,
            to: [to],
            subject: `Your Quote Request #${quoteId}`,
            html: `
        <h2>Hello ${customerName},</h2>
        <p>Thank you for your quote request. Please find your detailed quotation attached.</p>
        <p>This quote is valid for ${process.env.QUOTE_VALIDITY_DAYS || 30} days.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <br/>
        <p>Best regards,<br/>
        ${process.env.COMPANY_NAME || 'Your Company'}<br/>
        ${process.env.COMPANY_EMAIL || ''}<br/>
        ${process.env.COMPANY_PHONE || ''}</p>
      `,
            attachments: [
                {
                    filename: `quote-${quoteId}.pdf`,
                    content: pdfBuffer,
                },
            ],
        })

        if (error) {
            throw error
        }

        return { success: true, data }
    } catch (error) {
        console.error('Email sending error:', error)
        return { success: false, error }
    }
}

export async function sendAdminNotification({
    customerName,
    customerEmail,
    quoteId,
    itemCount,
}: {
    customerName: string
    customerEmail: string
    quoteId: string
    itemCount: number
}) {
    try {
        await resend.emails.send({
            from: 'RFQ System <onboarding@resend.dev>',
            to: [process.env.ADMIN_EMAIL || 'admin@company.com'],
            subject: `New RFQ Request #${quoteId}`,
            html: `
        <h2>New Quote Request Received</h2>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Quote ID:</strong> ${quoteId}</p>
        <p><strong>Items Requested:</strong> ${itemCount}</p>
        <br/>
        <p>View in admin dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/admin/requests</p>
      `,
        })
    } catch (error) {
        console.error('Admin notification error:', error)
    }
}
