import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
    try {
        // Delete all flagged emails
        const { error } = await supabaseAdmin
            .from('processed_emails')
            .delete()
            .in('status', ['flagged', 'error'])

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error clearing flagged emails:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
