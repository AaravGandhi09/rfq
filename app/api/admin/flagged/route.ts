import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('processed_emails')
            .select(`
        id,
        from_email,
        from_name,
        subject,
        received_at,
       confidence_score,
        status,
        error_message,
        folder_moved_to,
        ai_extraction,
        email_accounts (
          email
        )
      `)
            .in('status', ['flagged', 'error', 'pending'])
            .order('received_at', { ascending: false })
            .limit(100)

        if (error) throw error

        return NextResponse.json({ success: true, emails: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
