import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET all products
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, products: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create new product
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                name: body.name,
                description: body.description,
                specifications: body.specifications || {},
                category: body.category,
                base_price: body.base_price,
                min_price: body.min_price,
                max_price: body.max_price,
                unit: body.unit || 'unit',
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, product: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT - Update existing product
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updateData } = body

        console.log('PUT /api/admin/products - ID:', id)
        console.log('PUT /api/admin/products - Update Data:', updateData)

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase UPDATE error:', error)
            throw error
        }

        return NextResponse.json({ success: true, product: data })
    } catch (error: any) {
        console.error('PUT /api/admin/products error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
