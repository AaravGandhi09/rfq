import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET all email accounts
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('email_accounts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Don't expose passwords in response
        const safeData = data?.map(acc => ({
            ...acc,
            password_encrypted: '[HIDDEN]'
        }))

        return NextResponse.json({ success: true, accounts: safeData })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST new email account
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Encrypt password (base64 for now)
        const passwordEncrypted = Buffer.from(body.password).toString('base64')

        const { data, error } = await supabaseAdmin
            .from('email_accounts')
            .insert({
                email: body.email,
                provider: body.provider,
                imap_host: body.imap_host,
                imap_port: body.imap_port || 993,
                username: body.username || body.email,
                password_encrypted: passwordEncrypted,
                is_active: true,
                skip_read_emails: body.skip_read_emails ?? true,
                process_from_date: body.process_from_date || null,
                process_to_date: body.process_to_date || null,
                blacklisted_emails: body.blacklisted_emails || []
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, account: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT update email account
export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
        }

        const body = await request.json()

        // Build update object
        const updateData: any = {
            email: body.email,
            provider: body.provider,
            imap_host: body.imap_host,
            imap_port: body.imap_port || 993,
            username: body.username || body.email,
            skip_read_emails: body.skip_read_emails ?? true,
            process_from_date: body.process_from_date || null,
            process_to_date: body.process_to_date || null,
            blacklisted_emails: body.blacklisted_emails || []
        }

        // Only update password if provided (since we don't show it in edit form)
        if (body.password && body.password.trim()) {
            updateData.password_encrypted = Buffer.from(body.password).toString('base64')
        }

        const { data, error } = await supabaseAdmin
            .from('email_accounts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, account: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE email account
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('email_accounts')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
