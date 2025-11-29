import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
    try {
        // Create sample Excel template
        const templateData = [
            {
                'Product Name': 'iPhone 15 Pro',
                'Description': 'Latest Apple smartphone',
                'Category': 'Electronics',
                'Base Price': 999,
                'Min Price': 950,
                'Max Price': 1100,
                'Unit': 'piece'
            },
            {
                'Product Name': 'Samsung Galaxy S24',
                'Description': 'Premium Android phone',
                'Category': 'Electronics',
                'Base Price': 899,
                'Min Price': 850,
                'Max Price': 950,
                'Unit': 'piece'
            }
        ]

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(templateData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Products')

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml..sheet',
                'Content-Disposition': 'attachment; filename=product_template.xlsx'
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
