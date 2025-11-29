import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)

        const batchId = crypto.randomUUID()
        const imported: any[] = []
        const errors: any[] = []

        for (let i = 0; i < data.length; i++) {
            const row: any = data[i]

            try {
                // Map CSV columns (flexible column names)
                const productData = {
                    name: row['Product Name'] || row['name'] || row['Name'] || row['PRODUCT'],
                    description: row['Description'] || row['description'] || '',
                    category: row['Category'] || row['category'] || '',
                    base_price: parseFloat(row['Base Price'] || row['Price'] || row['base_price'] || 0),
                    min_price: parseFloat(row['Min Price'] || row['min_price'] || row['base_price'] || 0),
                    max_price: parseFloat(row['Max Price'] || row['max_price'] || row['base_price'] || 0),
                    unit: row['Unit'] || row['unit'] || 'unit',
                    specifications: row['Specifications'] || row['specifications'] || {},
                    is_active: true,
                    import_batch_id: batchId,
                    import_date: new Date().toISOString(),
                    import_source: 'csv'
                }

                if (!productData.name || productData.base_price <= 0) {
                    errors.push({ row: i + 1, error: 'Missing name or invalid price' })
                    continue
                }

                const { data: product, error } = await supabaseAdmin
                    .from('products')
                    .insert(productData)
                    .select()
                    .single()

                if (error) {
                    errors.push({ row: i + 1, error: error.message })
                } else {
                    imported.push(product)
                }
            } catch (error: any) {
                errors.push({ row: i + 1, error: error.message })
            }
        }

        return NextResponse.json({
            success: true,
            imported: imported.length,
            errors: errors.length,
            batchId,
            errorDetails: errors
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
