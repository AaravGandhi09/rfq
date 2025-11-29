import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET all customers
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, customers: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST new customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { data, error } = await supabaseAdmin
            .from('customers')
            .insert({
                name: body.name,
                email: body.email.toLowerCase(),
                company: body.company || null,
                phone: body.phone || null,
                notes: body.notes || null,
                shipping_address: body.shipping_address || null,
                billing_address: body.billing_address || null,
                gst_number: body.gst_number || null,
                website: body.website || null,
                is_active: body.is_active ?? true
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, customer: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT update customer
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
        }

        // Normalize email to lowercase
        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase()
        }

        const { data, error } = await supabaseAdmin
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, customer: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE customer
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('customers')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
