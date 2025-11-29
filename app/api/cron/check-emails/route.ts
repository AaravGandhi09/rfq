import { NextResponse } from 'next/server'
import { getAllActiveEmailAccounts, EmailMonitor } from '@/lib/email-monitor'
import { processEmail } from '@/lib/auto-quote-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Maximum execution time

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')

    // Verify cron secret to prevent unauthorized access
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('🔄 Starting email check...')

        const accounts = await getAllActiveEmailAccounts()

        if (accounts.length === 0) {
            return NextResponse.json({
                message: 'No active email accounts configured',
                processed: 0
            })
        }

        let totalProcessed = 0
        const results: any[] = []

        for (const account of accounts) {
            try {
                console.log(`\n📬 Checking ${account.email}...`)

                const monitor = new EmailMonitor(account)
                await monitor.connect()

                const emails = await monitor.fetchNewEmails()

                console.log(`Found ${emails.length} new emails in ${account.email}`)

                for (const email of emails) {
                    await processEmail(email, account.id)
                    totalProcessed++
                }

                await monitor.disconnect()

                results.push({
                    account: account.email,
                    processed: emails.length,
                    status: 'success'
                })
            } catch (error: any) {
                console.error(`Error processing ${account.email}:`, error)
                results.push({
                    account: account.email,
                    processed: 0,
                    status: 'error',
                    error: error.message
                })
            }
        }

        console.log(`✅ Email check complete. Processed ${totalProcessed} emails total.`)

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            totalProcessed,
            accounts: results
        })
    } catch (error: any) {
        console.error('Cron job error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
