import { NextResponse } from 'next/server'
import { getAllActiveEmailAccounts, EmailMonitor } from '@/lib/email-monitor'
import { processEmail } from '@/lib/auto-quote-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Maximum execution time

export async function GET(request: Request) {
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
            let processedCount = 0
            let errorCount = 0
            try {
                console.log(`\n📧 Checking ${account.email}...`)

                const monitor = new EmailMonitor(account)
                await monitor.connect()

                const newEmails = await monitor.fetchNewEmails()

                console.log(`📬 Found ${newEmails.length} new emails in ${account.email}`)

                for (const email of newEmails) {
                    try {
                        await processEmail(email, account.id)
                        processedCount++
                        totalProcessed++

                        // Mark email as SEEN after successful processing
                        await monitor.markAsSeen(email.messageId)
                        console.log(`✅ Marked email as SEEN: ${email.messageId}`)
                    } catch (error: any) {
                        console.error(`❌ Error processing email (ID: ${email.messageId}):`, error)
                        errorCount++
                    }
                }

                await monitor.disconnect()

                results.push({
                    account: account.email,
                    processed: processedCount,
                    errors: errorCount,
                    status: 'success'
                })
            } catch (error: any) {
                console.error(`Error connecting or fetching emails for ${account.email}:`, error)
                results.push({
                    account: account.email,
                    processed: processedCount,
                    errors: errorCount,
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
