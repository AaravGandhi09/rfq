'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, Plus, Trash2, Loader2, Edit } from 'lucide-react'
import Link from 'next/link'

export default function AdminEmailAccounts() {
    const router = useRouter()
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        provider: 'gmail',
        imap_host: 'imap.gmail.com',
        imap_port: '993',
        username: '',
        password: '',
        skip_read_emails: true,
        process_from_date: '',
        process_to_date: '',
        blacklisted_emails: [] as string[]
    })
    const [newBlacklistEmail, setNewBlacklistEmail] = useState('')

    useEffect(() => {
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin')
            return
        }
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/admin/email-accounts')
            const data = await res.json()
            setAccounts(data.accounts || [])
        } catch (error) {
            console.error('Error fetching accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProviderChange = (provider: string) => {
        const configs: any = {
            gmail: { imap_host: 'imap.gmail.com', imap_port: '993' },
            yahoo: { imap_host: 'imap.mail.yahoo.com', imap_port: '993' },
            cpanel: { imap_host: 'mail.yourdomain.com', imap_port: '993' }
        }

        setFormData({
            ...formData,
            provider,
            ...configs[provider]
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingId
                ? `/api/admin/email-accounts?id=${editingId}`
                : '/api/admin/email-accounts'

            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    imap_port: parseInt(formData.imap_port),
                    username: formData.username || formData.email
                })
            })

            const data = await res.json()

            if (!res.ok) {
                alert(`Error: ${data.error}`)
                return
            }

            setShowAddForm(false)
            setEditingId(null)
            setFormData({
                email: '',
                provider: 'gmail',
                imap_host: 'imap.gmail.com',
                imap_port: '993',
                username: '',
                password: '',
                skip_read_emails: true,
                process_from_date: '',
                process_to_date: '',
                blacklisted_emails: []
            })
            setNewBlacklistEmail('')
            fetchAccounts()
        } catch (error) {
            console.error('Error saving account:', error)
            alert('Failed to save account')
        }
    }

    const handleEdit = (account: any) => {
        setEditingId(account.id)
        setFormData({
            email: account.email,
            provider: account.provider,
            imap_host: account.imap_host,
            imap_port: account.imap_port.toString(),
            username: account.username || '',
            password: '', // Don't populate password for security
            skip_read_emails: account.skip_read_emails,
            process_from_date: account.process_from_date || '',
            process_to_date: account.process_to_date || '',
            blacklisted_emails: account.blacklisted_emails || []
        })
        setShowAddForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this email account?')) return

        try {
            await fetch(`/api/admin/email-accounts?id=${id}`, { method: 'DELETE' })
            fetchAccounts()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link href="/admin/dashboard">
                                <Button variant="outline" size="sm" className="text-gray-900">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <Mail className="w-8 h-8 text-purple-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
                        </div>
                        <Button onClick={() => setShowAddForm(!showAddForm)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Account
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {showAddForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-gray-900">{editingId ? 'Edit Email Account' : 'Add New Email Account'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label className="text-gray-900">Provider</Label>
                                    <select
                                        className="w-full p-2 border rounded text-black"
                                        value={formData.provider}
                                        onChange={(e) => handleProviderChange(e.target.value)}
                                    >
                                        <option value="gmail">Gmail</option>
                                        <option value="yahoo">Yahoo</option>
                                        <option value="cpanel">cPanel/Custom</option>
                                    </select>
                                    <p className="text-xs text-gray-900 mt-1">Select your email provider (IMAP settings auto-fill)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-900">Email Address</Label>
                                        <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required type="email" placeholder="email@example.com" />
                                    </div>
                                    <div>
                                        <Label className="text-gray-900">Username (if different from email)</Label>
                                        <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Leave blank to use email" />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-900">App Password / Password</Label>
                                    <Input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required type="password" placeholder="Enter app password" />
                                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-900">
                                        <strong>⚠️ What is an App Password?</strong>
                                        <ul className="mt-1 space-y-1 ml-4 list-disc">
                                            <li><strong>Gmail:</strong> Go to Google Account → Security → 2-Step Verification → App Passwords → Generate</li>
                                            <li><strong>Yahoo:</strong> Go to Account Security → Generate App Password → Select "Mail"</li>
                                            <li><strong>cPanel:</strong> Use your regular email password</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-900">IMAP Host</Label>
                                        <Input value={formData.imap_host} onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })} required />
                                        <p className="text-xs text-gray-900 mt-1">Auto-filled based on provider</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-900">IMAP Port</Label>
                                        <Input value={formData.imap_port} onChange={(e) => setFormData({ ...formData, imap_port: e.target.value })} required type="number" />
                                        <p className="text-xs text-gray-900 mt-1">Usually 993 for SSL</p>
                                    </div>
                                </div>


                                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-gray-900">
                                    <strong>ℹ️ IMAP Settings Reference:</strong>
                                    <ul className="mt-1 space-y-1 ml-4">
                                        <li><strong>Gmail:</strong> imap.gmail.com:993</li>
                                        <li><strong>Yahoo:</strong> imap.mail.yahoo.com:993</li>
                                        <li><strong>cPanel:</strong> mail.yourdomain.com:993 (replace with your domain)</li>
                                    </ul>
                                </div>

                                {/* Email Filters Section */}
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Filters (Optional)</h3>

                                    {/* Skip Read Emails */}
                                    <div className="mb-4">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="skip_read"
                                                checked={formData.skip_read_emails}
                                                onChange={(e) => setFormData({ ...formData, skip_read_emails: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <Label htmlFor="skip_read" className="text-gray-900 cursor-pointer">
                                                Skip read emails (only process unread/new emails)
                                            </Label>
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Label className="text-gray-900">Process emails from</Label>
                                            <Input
                                                type="date"
                                                value={formData.process_from_date}
                                                onChange={(e) => setFormData({ ...formData, process_from_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-900">Process emails until</Label>
                                            <Input
                                                type="date"
                                                value={formData.process_to_date}
                                                onChange={(e) => setFormData({ ...formData, process_to_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Blacklist */}
                                    <div>
                                        <Label className="text-gray-900">Blacklisted Emails</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={newBlacklistEmail}
                                                onChange={(e) => setNewBlacklistEmail(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (newBlacklistEmail && !formData.blacklisted_emails.includes(newBlacklistEmail)) {
                                                        setFormData({
                                                            ...formData,
                                                            blacklisted_emails: [...formData.blacklisted_emails, newBlacklistEmail.toLowerCase()]
                                                        })
                                                        setNewBlacklistEmail('')
                                                    }
                                                }}
                                                variant="outline"
                                                className="text-black"
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {formData.blacklisted_emails.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {formData.blacklisted_emails.map((email, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-100 rounded px-3 py-1">
                                                        <span className="text-sm text-gray-900">{email}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    blacklisted_emails: formData.blacklisted_emails.filter((_, i) => i !== idx)
                                                                })
                                                            }}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit">{editingId ? 'Update Account' : 'Add Account'}</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddForm(false)
                                            setEditingId(null)
                                            setFormData({
                                                email: '',
                                                provider: 'gmail',
                                                imap_host: 'imap.gmail.com',
                                                imap_port: '993',
                                                username: '',
                                                password: '',
                                                skip_read_emails: true,
                                                process_from_date: '',
                                                process_to_date: '',
                                                blacklisted_emails: []
                                            })
                                        }}
                                        className="text-black"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-gray-900">Configured Accounts ({accounts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-12 text-gray-900">
                                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No email accounts configured</p>
                                <p className="text-sm">Add Gmail, Yahoo, or cPanel accounts to start monitoring</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {accounts.map((account) => (
                                    <div key={account.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {account.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    {account.provider.toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg mt-2 text-gray-900">{account.email}</h3>
                                            <div className="text-sm text-gray-900 mt-1">
                                                <span>{account.imap_host}:{account.imap_port}</span>
                                                {account.total_emails_processed > 0 && (
                                                    <span className="ml-4">📬 Processed: {account.total_emails_processed} emails</span>
                                                )}
                                            </div>
                                            {account.last_checked && (
                                                <div className="text-xs text-gray-900 mt-1">
                                                    Last checked: {new Date(account.last_checked).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(account)}
                                                className="text-gray-900"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDelete(account.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">⚠️ Important Setup Notes</h3>
                    <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                        <li><strong>Gmail:</strong> Enable 2FA and create an App Password (not your regular password)</li>
                        <li><strong>Yahoo:</strong> Generate an App Password in account settings</li>
                        <li><strong>cPanel:</strong> Use your email password and custom domain IMAP host</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
