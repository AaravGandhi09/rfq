'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminQuotes() {
    const router = useRouter()
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin')
            return
        }
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        try {
            const res = await fetch('/api/admin/quotes')
            const data = await res.json()
            setQuotes(data.quotes || [])
        } catch (error) {
            console.error('Error fetching quotes:', error)
        } finally {
            setLoading(false)
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
                            <FileText className="w-8 h-8 text-green-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Auto-Sent Quotes</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-gray-900">Successfully Auto-Sent Quotes ({quotes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : quotes.length === 0 ? (
                            <div className="text-center py-12 text-gray-900">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No quotes sent yet</p>
                                <p className="text-sm">Quotes will appear here once emails are processed</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email Account</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Confidence</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Received</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotes.map((quote) => (
                                            <tr key={quote.id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{quote.from_name || 'Unknown'}</div>
                                                    <div className="text-sm text-gray-900">{quote.from_email}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{quote.subject}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {quote.email_accounts?.email || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {quote.confidence_score?.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {new Date(quote.received_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        {quote.quotes?.[0]?.pdf_url && (
                                                            <a href={quote.quotes[0].pdf_url} target="_blank" rel="noopener noreferrer">
                                                                <Button variant="outline" size="sm">
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    PDF
                                                                </Button>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
