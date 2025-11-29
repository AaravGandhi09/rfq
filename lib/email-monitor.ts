import Imap from 'imap'
import { simpleParser, ParsedMail } from 'mailparser'
import { supabaseAdmin } from './supabase'
import * as XLSX from 'xlsx'

export interface EmailAccount {
    id: string
    email: string
    provider: string
    imap_host: string
    imap_port: number
    username: string
    password_encrypted: string
    is_active: boolean
    skip_read_emails?: boolean
    process_from_date?: string
    process_to_date?: string
    blacklisted_emails?: string[]
}

export interface ParsedEmail {
    messageId: string
    threadId: string
    from: string
    fromName: string
    subject: string
    bodyText: string
    bodyHtml: string
    receivedAt: Date
    hasAttachments: boolean
    attachments: Array<{
        filename: string
        contentType: string
        size: number
        content: Buffer
    }>
}

export class EmailMonitor {
    private account: EmailAccount
    private imap: Imap | null = null

    constructor(account: EmailAccount) {
        this.account = account
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.imap = new Imap({
                user: this.account.username,
                password: this.decryptPassword(this.account.password_encrypted),
                host: this.account.imap_host,
                port: this.account.imap_port,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            })

            this.imap.once('ready', () => {
                console.log(`✅ Connected to ${this.account.email}`)
                resolve()
            })

            this.imap.once('error', (err: Error) => {
                console.error(`❌ IMAP error for ${this.account.email}:`, err)
                reject(err)
            })

            this.imap.connect()
        })
    }

    async fetchNewEmails(): Promise<ParsedEmail[]> {
        if (!this.imap) {
            throw new Error('IMAP not connected')
        }

        // Fetch email filters
        const filters = await this.fetchEmailFilters()

        return new Promise((resolve, reject) => {
            this.imap!.openBox('INBOX', false, (err, box) => {
                if (err) {
                    reject(err)
                    return
                }

                // Build search criteria based on filters
                const searchCriteria: any[] = []

                // Read status filter
                if (filters.skip_read_emails) {
                    searchCriteria.push('UNSEEN')
                } else {
                    searchCriteria.push('ALL')
                }

                // Date range filters
                if (filters.process_from_date) {
                    const fromDate = new Date(filters.process_from_date)
                    searchCriteria.push(['SINCE', fromDate])
                }
                if (filters.process_to_date) {
                    const toDate = new Date(filters.process_to_date)
                    searchCriteria.push(['BEFORE', toDate])
                }

                console.log(`🔍 Search criteria for ${this.account.email}:`, searchCriteria)

                this.imap!.search(searchCriteria, async (err, results) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    if (!results || results.length === 0) {
                        console.log(`📭 No new emails in ${this.account.email}`)
                        resolve([])
                        return
                    }

                    console.log(`📬 Found ${results.length} emails in ${this.account.email}`)

                    const parsedEmails: ParsedEmail[] = []
                    const fetch = this.imap!.fetch(results, { bodies: '' })

                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream) => {
                            simpleParser(stream as any, async (err, parsed) => {
                                if (err) {
                                    console.error('Parse error:', err)
                                    return
                                }

                                const parsedEmail = await this.parseMail(parsed)

                                // Check blacklist
                                const fromEmail = parsedEmail.from.toLowerCase()
                                const isBlacklisted = filters.blacklisted_emails?.some(
                                    (blocked: string) => blocked.toLowerCase() === fromEmail
                                )

                                if (isBlacklisted) {
                                    console.log(`🚫 Skipping blacklisted email from: ${fromEmail}`)
                                    return
                                }

                                parsedEmails.push(parsedEmail)
                            })
                        })
                    })

                    fetch.once('error', reject)
                    fetch.once('end', () => {
                        console.log(`✅ Processed ${parsedEmails.length} emails (after filtering)`)
                        resolve(parsedEmails)
                    })
                })
            })
        })
    }

    private async fetchEmailFilters(): Promise<any> {
        // Use account-specific filter settings
        return {
            skip_read_emails: this.account.skip_read_emails ?? true,
            process_from_date: this.account.process_from_date || null,
            process_to_date: this.account.process_to_date || null,
            blacklisted_emails: this.account.blacklisted_emails || []
        }
    }

    private async parseMail(parsed: ParsedMail): Promise<ParsedEmail> {
        const attachments = []

        if (parsed.attachments && parsed.attachments.length > 0) {
            for (const att of parsed.attachments) {
                attachments.push({
                    filename: att.filename || 'unknown',
                    contentType: att.contentType,
                    size: att.size,
                    content: att.content
                })
            }
        }

        return {
            messageId: parsed.messageId || '',
            threadId: parsed.inReplyTo || parsed.messageId || '',
            from: parsed.from?.value[0]?.address || '',
            fromName: parsed.from?.value[0]?.name || '',
            subject: parsed.subject || '',
            bodyText: parsed.text || '',
            bodyHtml: parsed.html || '',
            receivedAt: parsed.date || new Date(),
            hasAttachments: attachments.length > 0,
            attachments
        }
    }

    async disconnect(): Promise<void> {
        if (this.imap) {
            this.imap.end()
            this.imap = null
        }
    }

    private decryptPassword(encrypted: string): string {
        try {
            return Buffer.from(encrypted, 'base64').toString('utf-8')
        } catch {
            return encrypted
        }
    }
}

export async function parseExcelAttachment(buffer: Buffer): Promise<any[]> {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)
        return data
    } catch (error) {
        console.error('Excel parse error:', error)
        return []
    }
}

export async function getAllActiveEmailAccounts(): Promise<EmailAccount[]> {
    const { data, error } = await supabaseAdmin
        .from('email_accounts')
        .select('*')
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching email accounts:', error)
        return []
    }

    return data || []
}
