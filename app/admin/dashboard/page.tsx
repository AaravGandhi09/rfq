'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    LayoutDashboard,
    LogOut,
    Package,
    Mail,
    FileText,
    AlertCircle,
    Users
} from 'lucide-react'

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState({
        totalEmails: 0,
        autoSent: 0,
        flagged: 0,
        todayProcessed: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin')
            return
        }

        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats')
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('admin_session')
        router.push('/admin')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">RFQ Admin Panel</h1>
                            <p className="text-sm text-gray-900">Automated Quote Management</p>
                        </div>
                        <Button variant="outline" onClick={handleLogout} className="text-gray-900">
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-900">Total Emails</CardDescription>
                            <CardTitle className="text-3xl text-gray-900">{stats.totalEmails}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-900">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-900">Auto-Sent Quotes</CardDescription>
                            <CardTitle className="text-3xl text-green-600">{stats.autoSent}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-900">Successfully processed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-900">Flagged for Review</CardDescription>
                            <CardTitle className="text-3xl text-orange-600">{stats.flagged}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-900">Needs attention</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-900">Today's Activity</CardDescription>
                            <CardTitle className="text-3xl text-blue-600">{stats.todayProcessed}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-900">Last 24 hours</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Link href="/admin/products">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="pb-6">
                                <Package className="w-16 h-16 text-gray-900 mb-4" />
                                <CardTitle className="text-gray-900 text-xl">Product Database</CardTitle>
                                <CardDescription className="text-gray-900 text-base">Manage products and bulk upload</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/email-accounts">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="pb-6">
                                <Mail className="w-16 h-16 text-gray-900 mb-4" />
                                <CardTitle className="text-gray-900 text-xl">Email Accounts</CardTitle>
                                <CardDescription className="text-gray-900 text-base">Configure Gmail/Yahoo/cPanel accounts</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/customers">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="pb-6">
                                <Users className="w-16 h-16 text-gray-900 mb-4" />
                                <CardTitle className="text-gray-900 text-xl">Customers</CardTitle>
                                <CardDescription className="text-gray-900 text-base">Whitelist approved customers for auto-quoting</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/quotes">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="pb-6">
                                <FileText className="w-16 h-16 text-gray-900 mb-4" />
                                <CardTitle className="text-gray-900 text-xl">Auto-Sent Quotes</CardTitle>
                                <CardDescription className="text-gray-900 text-base">View all automatically generated quotes</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/flagged">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="pb-6">
                                <AlertCircle className="w-16 h-16 text-gray-900 mb-4" />
                                <CardTitle className="text-gray-900 text-xl">Flagged Emails</CardTitle>
                                <CardDescription className="text-gray-900 text-base">Review low-confidence or failed emails</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    )
}
