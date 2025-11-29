'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Send, Loader2 } from 'lucide-react'

interface RFQItem {
    id: string
    productName: string
    quantity: string
    specifications: string
}

export default function RFQPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // Customer info
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [notes, setNotes] = useState('')

    // RFQ Items
    const [items, setItems] = useState<RFQItem[]>([
        { id: '1', productName: '', quantity: '', specifications: '' }
    ])

    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), productName: '', quantity: '', specifications: '' }
        ])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof RFQItem, value: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            const response = await fetch('/api/rfq/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    customerEmail,
                    customerPhone,
                    companyName,
                    notes,
                    items: items.filter(item => item.productName && item.quantity)
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit request')
            }

            setSuccess(true)
            // Reset form
            setCustomerName('')
            setCustomerEmail('')
            setCustomerPhone('')
            setCompanyName('')
            setNotes('')
            setItems([{ id: '1', productName: '', quantity: '', specifications: '' }])

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Request for Quotation
                    </h1>
                    <p className="text-lg text-gray-600">
                        Fill out the form below and we'll send you a detailed quote within 24 hours
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Information</CardTitle>
                            <CardDescription>Please provide your contact details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="john@company.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company Name</Label>
                                    <Input
                                        id="company"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Acme Corporation"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Requirements</CardTitle>
                            <CardDescription>List the products you need quoted</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {items.map((item, index) => (
                                <div key={item.id} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                                        {items.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Product Name *</Label>
                                                <Input
                                                    value={item.productName}
                                                    onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                                                    placeholder="e.g., Industrial Bearing A-100"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Quantity *</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                    placeholder="e.g., 50"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Specifications / Requirements</Label>
                                            <Textarea
                                                value={item.specifications}
                                                onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                                                placeholder="Any specific requirements, size, color, etc."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Another Product
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Additional Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                            <CardDescription>Any other details we should know?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Special requirements, delivery preferences, budget constraints, etc."
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Success/Error Messages */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                            <p className="font-medium">✓ Request submitted successfully!</p>
                            <p className="text-sm mt-1">We've sent a detailed quote to your email. Please check your inbox.</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            <p className="font-medium">✗ Error submitting request</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 text-lg"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Submit Quote Request
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
