'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Package, Plus, Upload, Trash2, Edit, ArrowLeft, Loader2, Download } from 'lucide-react'
import Link from 'next/link'

export default function AdminProducts() {
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        specifications: '',
        category: '',
        base_price: '',
        min_price: '',
        max_price: '',
        unit: '',
        sku: '',
        hsn_code: '',
        is_active: true
    })
    useEffect(() => {
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin')
            return
        }
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/admin/products')
            const data = await res.json()
            setProducts(data.products || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    base_price: parseFloat(formData.base_price),
                    min_price: parseFloat(formData.min_price),
                    max_price: parseFloat(formData.max_price)
                })
            })

            if (res.ok) {
                setShowAddForm(false)
                setFormData({ name: '', description: '', specifications: '', category: '', base_price: '', min_price: '', max_price: '', unit: '', sku: '', hsn_code: '', is_active: true })
                fetchProducts()
            }
        } catch (error) {
            console.error('Error adding product:', error)
        }
    }

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/admin/products/bulk', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            alert(`Imported ${data.imported} products! ${data.errors} errors.`)
            fetchProducts()
        } catch (error) {
            console.error('Bulk upload error:', error)
            alert('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return

        try {
            await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
            fetchProducts()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleEditProduct = (product: any) => {
        setEditingId(product.id)
        setFormData({
            name: product.name,
            description: product.description || '',
            specifications: product.specifications || '',
            category: product.category || '',
            base_price: product.base_price.toString(),
            min_price: product.min_price?.toString() || '',
            max_price: product.max_price?.toString() || '',
            unit: product.unit || '',
            sku: product.sku || '',
            hsn_code: product.hsn_code || '',
            is_active: product.is_active
        })
        setShowAddForm(true)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    ...formData,
                    base_price: parseFloat(formData.base_price),
                    min_price: parseFloat(formData.min_price),
                    max_price: parseFloat(formData.max_price)
                })
            })

            if (res.ok) {
                setEditingId(null)
                setFormData({ name: '', description: '', specifications: '', category: '', base_price: '', min_price: '', max_price: '', unit: '', sku: '', hsn_code: '', is_active: true })
                fetchProducts()
            }
        } catch (error) {
            console.error('Error updating product:', error)
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
                            <Package className="w-8 h-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Product Database</h1>
                        </div>
                        <div className="flex gap-2">
                            <a href="/api/admin/products/template" download>
                                <Button variant="outline" className="text-black">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Template
                                </Button>
                            </a>
                            <label>
                                <Button disabled={uploading} className="cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploading ? 'Uploading...' : 'Upload Excel'}
                                </Button>
                                <input type="file" accept=".xlsx,.xls" onChange={handleBulkUpload} className="hidden" />
                            </label>
                            <Button onClick={() => setShowAddForm(!showAddForm)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Product
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {showAddForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Add New Product</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-900">Product Name</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Category</Label>
                                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-gray-900">HSN Code (for tax)</Label>
                                    <Input value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} placeholder="e.g. 84143011" />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-gray-900">Description</Label>
                                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Base Price</Label>
                                    <Input type="number" step="0.01" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Min Price</Label>
                                    <Input type="number" step="0.01" value={formData.min_price} onChange={(e) => setFormData({ ...formData, min_price: e.target.value })} required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Max Price</Label>
                                    <Input type="number" step="0.01" value={formData.max_price} onChange={(e) => setFormData({ ...formData, max_price: e.target.value })} required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Unit</Label>
                                    <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                                </div>
                                <div className="col-span-2 flex gap-2">
                                    <Button type="submit">Save Product</Button>
                                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-gray-900">All Products ({products.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Base Price</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price Range</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id} className="border-t hover:bg-gray-50">
                                                {editingId === product.id ? (
                                                    // Edit mode
                                                    <>
                                                        <td className="px-4 py-3" colSpan={6}>
                                                            <form onSubmit={handleUpdate} className="grid grid-cols-6 gap-2 items-end">
                                                                <div>
                                                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Product Name" className="text-sm" />
                                                                </div>
                                                                <div>
                                                                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Category" className="text-sm" />
                                                                </div>
                                                                <div>
                                                                    <Input type="number" step="0.01" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} required placeholder="Base Price" className="text-sm" />
                                                                </div>
                                                                <div>
                                                                    <Input type="number" step="0.01" value={formData.min_price} onChange={(e) => setFormData({ ...formData, min_price: e.target.value })} required placeholder="Min" className="text-sm" />
                                                                </div>
                                                                <div>
                                                                    <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Unit" className="text-sm" />
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button type="submit" size="sm" className="h-8">Save</Button>
                                                                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 text-gray-900">Cancel</Button>
                                                                </div>
                                                            </form>
                                                        </td>
                                                    </>
                                                ) : (
                                                    // View mode
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-900">{product.description}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{product.category}</td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900">₹{product.base_price}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">₹{product.min_price} - ₹{product.max_price}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{product.unit}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1">
                                                                <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)} className="text-gray-900"><Edit className="w-4 h-4" /></Button>
                                                                <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">📄 Bulk Upload Instructions</h3>
                    <p className="text-sm text-gray-900 mb-2">Follow these steps:</p>
                    <ol className="text-sm text-gray-900 space-y-1 list-decimal list-inside">
                        <li>Click <strong>"Download Template"</strong> to get the Excel format</li>
                        <li>Fill in your products in the Excel file</li>
                        <li>Click <strong>"Upload Excel"</strong> and select your filled file</li>
                        <li>Products will be imported automatically!</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
