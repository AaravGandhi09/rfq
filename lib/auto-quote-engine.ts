import { EmailMonitor, ParsedEmail, parseExcelAttachment } from './email-monitor'
import { extractProductsFromEmail, extractProductsFromExcel, ExtractedProduct } from './ai-parser'
import { findBestMatch, calculateQuotedPrice, Product } from './product-matcher'
import { generateQuotePDF } from './pdf-generator'
import { supabaseAdmin } from './supabase'
import nodemailer from 'nodemailer'

const CONFIDENCE_THRESHOLD = 95

export interface ProcessingResult {
    success: boolean
    emailsProcessed: number
    autoSent: number
    flagged: number
    errors: number
}

export async function processEmail(
    email: ParsedEmail,
    emailAccountId: string
): Promise<void> {
    try {
        console.log(`📧 Processing email from ${email.from}: ${email.subject}`)

        // STEP 0: Check customer whitelist
        const { data: customer } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('email', email.from.toLowerCase())
            .eq('is_active', true)
            .single()

        if (!customer) {
            console.log(`🚫 Email from ${email.from} is NOT whitelisted - ignoring`)
            return
        }

        console.log(`✅ Customer whitelisted: ${customer.name} (${customer.email})`)

        // Step 1: Extract products using AI
        let aiExtraction = await extractProductsFromEmail(email.bodyText, email.subject)

        // Step 2: Check for Excel attachments
        if (email.hasAttachments) {
            for (const attachment of email.attachments) {
                if (
                    attachment.filename.endsWith('.xlsx') ||
                    attachment.filename.endsWith('.xls') ||
                    attachment.filename.endsWith('.csv')
                ) {
                    console.log(`📎 Found Excel attachment: ${attachment.filename}`)
                    const excelData = await parseExcelAttachment(attachment.content)
                    const excelExtraction = await extractProductsFromExcel(excelData)

                    // Merge with email body extraction
                    if (excelExtraction.success) {
                        aiExtraction.products = [
                            ...aiExtraction.products,
                            ...excelExtraction.products
                        ]
                        aiExtraction.confidence = Math.max(
                            aiExtraction.confidence,
                            excelExtraction.confidence
                        )
                    }
                }
            }
        }

        // Save processed email to database
        const { data: processedEmail, error: saveError } = await supabaseAdmin
            .from('processed_emails')
            .insert({
                email_account_id: emailAccountId,
                message_id: email.messageId,
                thread_id: email.threadId,
                from_email: email.from,
                from_name: email.fromName,
                subject: email.subject,
                body_text: email.bodyText,
                body_html: email.bodyHtml,
                has_attachments: email.hasAttachments,
                attachment_info: email.attachments.map(a => ({
                    filename: a.filename,
                    type: a.contentType,
                    size: a.size
                })),
                received_at: email.receivedAt,
                status: 'pending',
                confidence_score: aiExtraction.confidence,
                ai_extraction: aiExtraction
            })
            .select()
            .single()

        if (saveError) {
            console.error('Error saving email:', saveError)
            return
        }

        // Step 3: Check if AI extraction was successful
        if (!aiExtraction.success || aiExtraction.products.length === 0) {
            console.log(`⚠️ AI could not extract products. Moving to "Not Understood" folder`)
            await updateEmailStatus(processedEmail.id, 'flagged', 'Not Understood')
            // TODO: Move to folder via IMAP
            return
        }

        // Step 4: Match products with database
        const { data: products } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_active', true)

        const allProducts: Product[] = products || []
        const matchedItems: any[] = []
        const unmatchedItems: any[] = []
        let totalConfidence = 0

        for (const extracted of aiExtraction.products) {
            const match = findBestMatch(extracted.product, allProducts, 0.70)

            if (match && match.similarity >= 0.95) {
                // High confidence match
                const quotedPrice = calculateQuotedPrice(
                    match.product.base_price,
                    extracted.quantity,
                    match.product.min_price,
                    match.product.max_price
                )

                matchedItems.push({
                    productName: match.product.name,
                    quantity: extracted.quantity,
                    specifications: extracted.specifications || match.product.description,
                    isMatched: true,
                    unitPrice: quotedPrice,
                    total: quotedPrice * extracted.quantity,
                    hsnCode: match.product.hsn_code || ''
                })

                totalConfidence += match.similarity * 100
            } else {
                // Low confidence or no match
                unmatchedItems.push({
                    productName: extracted.product,
                    quantity: extracted.quantity,
                    specifications: extracted.specifications,
                    isMatched: false
                })
            }
        }

        const avgConfidence = totalConfidence / aiExtraction.products.length

        // Step 5: Decide: Auto-send or Flag
        if (avgConfidence >= CONFIDENCE_THRESHOLD && matchedItems.length > 0) {
            console.log(`✅ Confidence ${avgConfidence.toFixed(1)}% - Auto-sending quote`)
            await autoSendQuote(processedEmail, matchedItems, unmatchedItems, email)
        } else {
            console.log(`⚠️ Confidence ${avgConfidence.toFixed(1)}% - Flagging for review`)
            await updateEmailStatus(
                processedEmail.id,
                'flagged',
                avgConfidence < CONFIDENCE_THRESHOLD ? 'Low Confidence' : 'No Matches'
            )
        }
    } catch (error) {
        console.error('Error processing email:', error)
        // Log error but don't crash
    }
}

async function autoSendQuote(
    processedEmail: any,
    matchedItems: any[],
    unmatchedItems: any[],
    originalEmail: ParsedEmail
): Promise<void> {
    try {
        // Fetch customer details for quote
        const { data: customerData } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('email', processedEmail.from_email.toLowerCase())
            .eq('is_active', true)
            .single()

        // Create RFQ request
        const { data: rfqRequest } = await supabaseAdmin
            .from('rfq_requests')
            .insert({
                customer_name: processedEmail.from_name || processedEmail.from_email,
                customer_email: processedEmail.from_email,
                notes: processedEmail.subject,
                status: 'quoted',
                email_id: processedEmail.id,
                auto_generated: true
            })
            .select()
            .single()

        if (!rfqRequest) {
            throw new Error('Failed to create RFQ request')
        }

        // Calculate subtotal
        const subtotal = matchedItems.reduce((sum, item) => sum + item.total, 0)

        // Generate PDF with customer details
        const quoteData = {
            quoteId: rfqRequest.id.substring(0, 8).toUpperCase(),
            customerName: customerData?.name || processedEmail.from_name || processedEmail.from_email,
            customerEmail: processedEmail.from_email,
            companyName: customerData?.company || '',
            customerGstin: customerData?.gst_number || '',
            billingAddress: customerData?.billing_address || '',
            shippingAddress: customerData?.shipping_address || customerData?.billing_address || '',
            matchedItems,
            unmatchedItems,
            subtotal,
            date: new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }

        const pdfBuffer = await generateQuotePDF(quoteData)

        // Upload PDF to Supabase Storage
        const pdfFileName = `quote-${rfqRequest.id}.pdf`
        await supabaseAdmin.storage
            .from('quote-pdfs')
            .upload(pdfFileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        const { data: urlData } = supabaseAdmin.storage
            .from('quote-pdfs')
            .getPublicUrl(pdfFileName)

        // Save quote
        await supabaseAdmin.from('quotes').insert({
            request_id: rfqRequest.id,
            pdf_url: urlData.publicUrl,
            status: 'sent',
            sent_at: new Date().toISOString()
        })

        // Send email reply
        await sendQuoteEmail(processedEmail, originalEmail, pdfBuffer, quoteData.quoteId)

        // Update processed email status
        await updateEmailStatus(processedEmail.id, 'auto_sent', 'Processed', rfqRequest.id)

        console.log(`✅ Auto-sent quote #${quoteData.quoteId} to ${processedEmail.from_email}`)
    } catch (error) {
        console.error('Error auto-sending quote:', error)
        await updateEmailStatus(processedEmail.id, 'error', null, null, (error as Error).message)
    }
}

async function sendQuoteEmail(
    processedEmail: any,
    originalEmail: ParsedEmail,
    pdfBuffer: Buffer,
    quoteId: string
): Promise<void> {
    // Get email account for SMTP
    const { data: account } = await supabaseAdmin
        .from('email_accounts')
        .select('*')
        .eq('id', processedEmail.email_account_id)
        .single()

    if (!account) {
        throw new Error('Email account not found')
    }

    const transporter = nodemailer.createTransport({
        host: account.imap_host.replace('imap', 'smtp'),
        port: 587,
        secure: false,
        auth: {
            user: account.username,
            pass: Buffer.from(account.password_encrypted, 'base64').toString('utf-8')
        }
    })

    await transporter.sendMail({
        from: account.email,
        to: processedEmail.from_email,
        subject: `Re: ${originalEmail.subject}`,
        inReplyTo: originalEmail.messageId,
        references: originalEmail.threadId,
        text: `Dear ${processedEmail.from_name || 'Customer'},

Thank you for your quote request.

Please find attached your detailed quotation #${quoteId}.

This quote is valid for 30 days from the date of issue.

If you have any questions, please don't hesitate to contact us.

Best regards,
${process.env.COMPANY_NAME || 'Your Company'}`,
        attachments: [
            {
                filename: `quote-${quoteId}.pdf`,
                content: pdfBuffer
            }
        ]
    })
}

async function updateEmailStatus(
    emailId: string,
    status: string,
    folderMovedTo?: string | null,
    quoteId?: string | null,
    errorMessage?: string
): Promise<void> {
    await supabaseAdmin
        .from('processed_emails')
        .update({
            status,
            folder_moved_to: folderMovedTo,
            quote_id: quoteId,
            error_message: errorMessage
        })
        .eq('id', emailId)
}
