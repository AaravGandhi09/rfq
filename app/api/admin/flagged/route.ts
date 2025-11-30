import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('processed_emails')
            .select('*, email_accounts(email)')
            .in('status', ['flagged', 'error'])
            .order('received_at', { ascending: false })
            .limit(50)

        if (error) throw error

        return NextResponse.json({ success: true, emails: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
