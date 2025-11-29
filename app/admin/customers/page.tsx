'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, ArrowLeft, Plus, Edit, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminCustomers() {
    const router = useRouter()
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        shipping_address: '',
        billing_address: '',
        gst_number: '',
        website: '',
        notes: '',
        is_active: true
    })

    useEffect(() => {
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin')
            return
        }
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/admin/customers')
            const data = await res.json()
            setCustomers(data.customers || [])
        } catch (error) {
            console.error('Error fetching customers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/admin/customers'
            const method = editingId ? 'PUT' : 'POST'
            const body = editingId ? { id: editingId, ...formData } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setShowForm(false)
                setEditingId(null)
                resetForm()
                fetchCustomers()
            } else {
                const error = await res.json()
                alert(`Failed to save customer: ${error.error}`)
            }
        } catch (error) {
            console.error('Error saving customer:', error)
            alert('Error saving customer')
        }
    }

    const handleEdit = (customer: any) => {
        setEditingId(customer.id)
        setFormData({
            name: customer.name,
            email: customer.email,
            company: customer.company || '',
            phone: customer.phone || '',
            shipping_address: customer.shipping_address || '',
            billing_address: customer.billing_address || '',
            gst_number: customer.gst_number || '',
            website: customer.website || '',
            notes: customer.notes || '',
            is_active: customer.is_active
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer? They will no longer receive auto-quotes.')) return

        try {
            await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' })
            fetchCustomers()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const toggleStatus = async (customer: any) => {
        try {
            await fetch('/api/admin/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: customer.id,
                    is_active: !customer.is_active
                })
            })
            fetchCustomers()
        } catch (error) {
            console.error('Toggle status error:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            company: '',
            phone: '',
            shipping_address: '',
            billing_address: '',
            gst_number: '',
            website: '',
            notes: '',
            is_active: true
        })
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingId(null)
        resetForm()
    }

    const activeCount = customers.filter(c => c.is_active).length

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
                            <Users className="w-8 h-8 text-indigo-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                                <p className="text-sm text-gray-900">Whitelist for auto-quoting</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowForm(!showForm)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">ℹ️ How Customer Whitelist Works</h3>
                    <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                        <li>Only emails from <strong>active customers</strong> will receive auto-quotes</li>
                        <li>All other emails will be ignored completely</li>
                        <li>Add trusted customers here to enable auto-quoting for them</li>
                        <li>Inactive customers won't receive quotes until reactivated</li>
                    </ul>
                </div>

                {showForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-gray-900">
                                {editingId ? 'Edit Customer' : 'Add New Customer'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-900">Customer Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-900">Email Address *</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-900">Company</Label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-900">Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-900">GST Number</Label>
                                        <Input
                                            value={formData.gst_number}
                                            onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                                            placeholder="e.g. 29ABCDE1234F1Z5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-900">Website</Label>
                                        <Input
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-900">Shipping Address</Label>
                                    <Textarea
                                        value={formData.shipping_address}
                                        onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                                        rows={3}
                                        placeholder="Full shipping address..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-gray-900">Billing Address</Label>
                                    <Textarea
                                        value={formData.billing_address}
                                        onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                                        rows={3}
                                        placeholder="Full billing address (leave empty if same as shipping)..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-gray-900">Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        placeholder="Internal notes about this customer..."
                                    />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_active" className="text-gray-900 cursor-pointer">
                                        Active (will receive auto-quotes)
                                    </Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit">{editingId ? 'Update' : 'Add'} Customer</Button>
                                    <Button type="button" variant="outline" onClick={handleCancel} className="text-black">
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-gray-900">All Customers ({customers.length})</CardTitle>
                                <CardDescription className="text-gray-900">
                                    {activeCount} active • {customers.length - activeCount} inactive
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="text-center py-12 text-gray-900">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No customers added yet</p>
                                <p className="text-sm mt-1">Add customers to enable auto-quoting for their emails</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={`border rounded-lg p-4 ${customer.is_active ? 'bg-white hover:bg-gray-50' : 'bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg text-gray-900">{customer.name}</h3>
                                                    {customer.is_active ? (
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" /> Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-900">
                                                    <div>
                                                        <span className="font-medium">Email:</span> {customer.email}
                                                    </div>
                                                    {customer.company && (
                                                        <div>
                                                            <span className="font-medium">Company:</span> {customer.company}
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div>
                                                            <span className="font-medium">Phone:</span> {customer.phone}
                                                        </div>
                                                    )}
                                                    {customer.gst_number && (
                                                        <div>
                                                            <span className="font-medium">GST:</span> {customer.gst_number}
                                                        </div>
                                                    )}
                                                    {customer.website && (
                                                        <div>
                                                            <span className="font-medium">Website:</span>{' '}
                                                            <a href={customer.website} target="_blank" className="text-blue-600 hover:underline">
                                                                {customer.website}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                {(customer.shipping_address || customer.billing_address) && (
                                                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm text-gray-900">
                                                        {customer.shipping_address && (
                                                            <div>
                                                                <span className="font-medium block mb-1">Shipping:</span>
                                                                <p className="whitespace-pre-line">{customer.shipping_address}</p>
                                                            </div>
                                                        )}
                                                        {customer.billing_address && (
                                                            <div>
                                                                <span className="font-medium block mb-1">Billing:</span>
                                                                <p className="whitespace-pre-line">{customer.billing_address}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {customer.notes && (
                                                    <div className="mt-2 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                        <span className="font-medium">Notes:</span> {customer.notes}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleStatus(customer)}
                                                    className={customer.is_active ? 'text-orange-600' : 'text-green-600'}
                                                >
                                                    {customer.is_active ? 'Deactivate' : 'Activate'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(customer)}
                                                    className="text-gray-900"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(customer.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
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
