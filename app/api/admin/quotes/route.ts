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
        quote_id,
        quotes (
          id,
          pdf_url,
          sent_at
        ),
        email_accounts (
          email
        )
      `)
      .eq('status', 'auto_sent')
      .order('received_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ success: true, quotes: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
