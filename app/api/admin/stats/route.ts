import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        // Get total emails
        const { count: totalEmails } = await supabaseAdmin
            .from('processed_emails')
            .select('*', { count: 'exact', head: true })

        // Get auto-sent count
        const { count: autoSent } = await supabaseAdmin
            .from('processed_emails')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'auto_sent')

        // Get flagged count
        const { count: flagged } = await supabaseAdmin
            .from('processed_emails')
            .select('*', { count: 'exact', head: true })
            .in('status', ['flagged', 'error'])

        // Get today's processed
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { count: todayProcessed } = await supabaseAdmin
            .from('processed_emails')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString())

        return NextResponse.json({
            totalEmails: totalEmails || 0,
            autoSent: autoSent || 0,
            flagged: flagged || 0,
            todayProcessed: todayProcessed || 0
        })
    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json({
            totalEmails: 0,
            autoSent: 0,
            flagged: 0,
            todayProcessed: 0
        })
    }
}
