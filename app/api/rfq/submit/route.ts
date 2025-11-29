import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { findBestMatch, calculateQuotedPrice, Product } from '@/lib/product-matcher'
import { generateQuotePDF } from '@/lib/pdf-generator'
import { sendQuoteEmail, sendAdminNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { customerName, customerEmail, customerPhone, companyName, notes, items } = body

        // Validation
        if (!customerName || !customerEmail || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 1. Create RFQ request in database
        const { data: rfqRequest, error: requestError } = await supabaseAdmin
            .from('rfq_requests')
            .insert({
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                company_name: companyName,
                notes: notes,
                status: 'pending'
            })
            .select()
            .single()

        if (requestError) {
            console.error('Error creating RFQ request:', requestError)
            return NextResponse.json(
                { error: 'Failed to create request' },
                { status: 500 }
            )
        }

        // 2. Fetch all active products for matching
        const { data: products, error: productsError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_active', true)

        if (productsError) {
            console.error('Error fetching products:', productsError)
        }

        const allProducts: Product[] = products || []

        // 3. Process each requested item and match with products
        const matchedItems: any[] = []
        const unmatchedItems: any[] = []

        for (const item of items) {
            const { productName, quantity, specifications } = item

            // Try to find a matching product
            const match = findBestMatch(productName, allProducts, 0.7)

            let rfqItemData: any = {
                request_id: rfqRequest.id,
                product_name: productName,
                quantity: parseInt(quantity),
                specifications: specifications,
                is_matched: false
            }

            if (match) {
                // Product matched!
                const quotedPrice = calculateQuotedPrice(
                    match.product.base_price,
                    parseInt(quantity),
                    match.product.min_price,
                    match.product.max_price
                )

                rfqItemData.matched_product_id = match.product.id
                rfqItemData.quoted_price = quotedPrice
                rfqItemData.is_matched = true

                matchedItems.push({
                    productName: match.product.name,
                    quantity: parseInt(quantity),
                    specifications: specifications || match.product.description,
                    isMatched: true,
                    unitPrice: quotedPrice,
                    total: quotedPrice * parseInt(quantity)
                })
            } else {
                // No match found
                unmatchedItems.push({
                    productName: productName,
                    quantity: parseInt(quantity),
                    specifications: specifications,
                    isMatched: false
                })
            }

            // Save RFQ item to database
            await supabaseAdmin.from('rfq_items').insert(rfqItemData)
        }

        // 4. Calculate subtotal
        const subtotal = matchedItems.reduce((sum, item) => sum + item.total, 0)

        // 5. Generate PDF quote
        const quoteData = {
            quoteId: rfqRequest.id.substring(0, 8).toUpperCase(),
            customerName,
            customerEmail,
            companyName,
            matchedItems,
            unmatchedItems,
            subtotal,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            validUntil: new Date(Date.now() + (parseInt(process.env.QUOTE_VALIDITY_DAYS || '30') * 24 * 60 * 60 * 1000))
                .toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
        }

        const pdfBuffer = await generateQuotePDF(quoteData)

        // 6. Upload PDF to Supabase Storage
        const pdfFileName = `quote-${rfqRequest.id}.pdf`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('quote-pdfs')
            .upload(pdfFileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (uploadError) {
            console.error('Error uploading PDF:', uploadError)
        }

        // Get public URL for the PDF
        const { data: urlData } = supabaseAdmin.storage
            .from('quote-pdfs')
            .getPublicUrl(pdfFileName)

        const pdfUrl = urlData.publicUrl

        // 7. Save quote record
        await supabaseAdmin.from('quotes').insert({
            request_id: rfqRequest.id,
            pdf_url: pdfUrl,
            status: 'generated',
            sent_at: new Date().toISOString()
        })

        // 8. Send email to customer with PDF attachment
        const emailResult = await sendQuoteEmail({
            to: customerEmail,
            customerName,
            quoteId: quoteData.quoteId,
            pdfBuffer
        })

        // 9. Send notification to admin
        await sendAdminNotification({
            customerName,
            customerEmail,
            quoteId: quoteData.quoteId,
            itemCount: items.length
        })

        // 10. Update request status
        await supabaseAdmin
            .from('rfq_requests')
            .update({ status: 'quoted' })
            .eq('id', rfqRequest.id)

        return NextResponse.json({
            success: true,
            quoteId: quoteData.quoteId,
            matchedCount: matchedItems.length,
            unmatchedCount: unmatchedItems.length,
            message: 'Quote generated and sent successfully'
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
