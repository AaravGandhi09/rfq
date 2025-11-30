'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminFlagged() {
    const router = useRouter()
    const [emails, setEmails] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin')
            return
        }
        fetchFlagged()
    }, [])

    const fetchFlagged = async () => {
        try {
            const res = await fetch('/api/admin/flagged')
            const data = await res.json()
            setEmails(data.emails || [])
        } catch (error) {
            console.error('Error fetching flagged emails:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to clear all flagged emails? This cannot be undone.')) {
            return
        }

        try {
            const res = await fetch('/api/admin/flagged/clear', {
                method: 'POST'
            })

            if (res.ok) {
                setEmails([])
                alert('All flagged emails cleared successfully!')
            } else {
                alert('Failed to clear flagged emails')
            }
        } catch (error) {
            console.error('Error clearing flagged emails:', error)
            alert('Failed to clear flagged emails')
        }
    }

    const getStatusBadge = (status: string) => {
        const colors: any = {
            flagged: 'bg-orange-100 text-orange-800',
            error: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
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
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Flagged Emails</h1>
                        </div>
                        {emails.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleClearAll}
                            >
                                Clear All Flagged
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-gray-900">Emails Requiring Manual Review ({emails.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="text-center py-12 text-gray-900">
                                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No flagged emails</p>
                                <p className="text-sm">All emails are being processed successfully! 🎉</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {emails.map((email) => (
                                    <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(email.status)}`}>
                                                        {email.status.toUpperCase()}
                                                    </span>
                                                    {email.confidence_score !== null && email.confidence_score !== undefined && (
                                                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                                                            Confidence: {email.confidence_score.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-lg">{email.subject || '(No Subject)'}</h3>
                                                <div className="text-sm text-gray-900 mt-1">
                                                    <span className="font-medium">{email.from_name || email.from_email}</span>
                                                    {email.from_name && <span className="text-gray-400"> ({email.from_email})</span>}
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-gray-900">
                                                <div>{new Date(email.received_at).toLocaleDateString()}</div>
                                                <div>{new Date(email.received_at).toLocaleTimeString()}</div>
                                                <div className="text-xs mt-1">via {email.email_accounts?.email}</div>
                                            </div>
                                        </div>

                                        {email.error_message && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                                <strong>Error:</strong> {email.error_message}
                                            </div>
                                        )}

                                        {email.folder_moved_to && (
                                            <div className="mt-2 text-sm text-gray-900">
                                                📁 Moved to: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{email.folder_moved_to}</span>
                                            </div>
                                        )}

                                        {/* AI Extraction Result - ALWAYS VISIBLE */}
                                        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-blue-600 text-lg">🤖</span>
                                                <h4 className="font-bold text-sm" style={{ color: '#000' }}>AI EXTRACTION (What AI Read)</h4>
                                            </div>
                                            <pre className="text-xs whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-100 max-h-64 overflow-auto" style={{ color: '#000' }}>
                                                {email.ai_extraction ? JSON.stringify(email.ai_extraction, null, 2) : 'No AI extraction data available for this email.'}
                                            </pre>
                                        </div>


                                        {/* Confidence Reasoning */}
                                        {email.confidence_score !== null && email.confidence_score !== undefined && (
                                            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-yellow-600 text-lg">💡</span>
                                                    <h4 className="font-bold text-sm" style={{ color: '#000' }}>CONFIDENCE REASONING ({email.confidence_score.toFixed(1)}%)</h4>
                                                </div>
                                                <div className="text-sm bg-white p-3 rounded border border-yellow-100" style={{ color: '#000' }}>
                                                    {email.confidence_score >= 80 ? (
                                                        <p>✅ <strong>High Confidence:</strong> Email contains clear product requests with quantities. All required information is present and easy to extract.</p>
                                                    ) : email.confidence_score >= 50 ? (
                                                        <p>⚠️ <strong>Medium Confidence:</strong> Email mentions products but may be missing some details like quantities or specifications. Some ambiguity in the request.</p>
                                                    ) : (
                                                        <p>❌ <strong>Low Confidence:</strong> Email is unclear or doesn't contain typical RFQ patterns. May need manual review to determine if it's a genuine quote request.</p>
                                                    )}
                                                    {email.ai_extraction?.error && (
                                                        <p className="mt-2 text-red-600"><strong>AI Error:</strong> {email.ai_extraction.error}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
