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
    const [productCategory, setProductCategory] = useState<'phone' | 'laptop' | 'other'>('other')
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        specifications: '',
        category: '',
        mrp: '',  // MRP inclusive of GST
        base_price: '',  // Auto-calculated from MRP
        min_price: '',
        max_price: '',
        unit: '',
        sku: '',
        hsn_code: '',
        is_active: true,
        // Phone/Laptop specific
        storage: '',
        ram: '',
        processor: '',
        gpu: ''
    })

    // Auto-calculate base price from MRP
    const handleMRPChange = (mrp: string) => {
        const mrpValue = parseFloat(mrp)
        if (mrpValue && !isNaN(mrpValue)) {
            // Base price = MRP / 1.18 (remove 18% GST)
            const basePrice = (mrpValue / 1.18).toFixed(2)
            setFormData({ ...formData, mrp, base_price: basePrice })
        } else {
            setFormData({ ...formData, mrp, base_price: '' })
        }
    }
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

        // Build specifications based on category
        let specifications = formData.specifications
        if (productCategory === 'phone') {
            specifications = `Storage: ${formData.storage}, RAM: ${formData.ram}`
        } else if (productCategory === 'laptop') {
            specifications = `Storage: ${formData.storage}, RAM: ${formData.ram}, Processor: ${formData.processor}, GPU: ${formData.gpu}`
        }

        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    specifications,
                    base_price: parseFloat(formData.base_price),
                    min_price: parseFloat(formData.min_price),
                    max_price: parseFloat(formData.max_price)
                })
            })

            if (res.ok) {
                setShowAddForm(false)
                setFormData({ name: '', description: '', specifications: '', category: '', mrp: '', base_price: '', min_price: '', max_price: '', unit: '', sku: '', hsn_code: '', is_active: true, storage: '', ram: '', processor: '', gpu: '' })
                setProductCategory('other')
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

        // Detect product category from specifications
        const specs = String(product.specifications || '')
        const detectedCategory = (specs.includes('Storage:') || specs.includes('RAM:'))
            ? (specs.includes('Processor:') ? 'laptop' : 'phone')
            : 'other'
        setProductCategory(detectedCategory)
        console.log('Edit Product - Detected Category:', detectedCategory, 'Specs:', specs)

        // Parse specs for phone/laptop
        const storageMatch = specs.match(/Storage:\s*([^,|]+)/)
        const ramMatch = specs.match(/RAM:\s*([^,|]+)/)
        const processorMatch = specs.match(/Processor:\s*([^,|]+)/)
        const gpuMatch = specs.match(/GPU:\s*([^,|]+)/)

        setFormData({
            name: product.name,
            description: product.description || '',
            specifications: product.specifications || '',
            category: product.category || '',
            mrp: product.mrp?.toString() || '',
            base_price: product.base_price.toString(),
            min_price: product.min_price?.toString() || '',
            max_price: product.max_price?.toString() || '',
            unit: product.unit || '',
            sku: product.sku || '',
            hsn_code: product.hsn_code || '',
            is_active: product.is_active,
            storage: storageMatch ? storageMatch[1].trim() : '',
            ram: ramMatch ? ramMatch[1].trim() : '',
            processor: processorMatch ? processorMatch[1].trim() : '',
            gpu: gpuMatch ? gpuMatch[1].trim() : ''
        })
        console.log('Form Data Set:', formData)
        setShowAddForm(true)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        // Build specifications based on category (same as add)
        let specifications = formData.specifications
        if (productCategory === 'phone') {
            specifications = `Storage: ${formData.storage}, RAM: ${formData.ram}`
        } else if (productCategory === 'laptop') {
            specifications = `Storage: ${formData.storage}, RAM: ${formData.ram}, Processor: ${formData.processor}, GPU: ${formData.gpu}`
        }

        try {
            const res = await fetch('/api/admin/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    ...formData,
                    specifications,
                    base_price: parseFloat(formData.base_price),
                    min_price: parseFloat(formData.min_price),
                    max_price: parseFloat(formData.max_price),
                    mrp: formData.mrp ? parseFloat(formData.mrp) : null
                })
            })

            if (res.ok) {
                setEditingId(null)
                setProductCategory('other')
                setFormData({ name: '', description: '', specifications: '', category: '', mrp: '', base_price: '', min_price: '', max_price: '', unit: '', sku: '', hsn_code: '', is_active: true, storage: '', ram: '', processor: '', gpu: '' })
                setShowAddForm(false)
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
                            <CardTitle className="text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={editingId ? handleUpdate : handleAddProduct} className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-900">Product Name</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Product Type *</Label>
                                    <select
                                        className="w-full p-2 border rounded text-gray-900"
                                        value={productCategory}
                                        onChange={(e) => setProductCategory(e.target.value as 'phone' | 'laptop' | 'other')}
                                    >
                                        <option value="phone">📱 Phone</option>
                                        <option value="laptop">💻 Laptop</option>
                                        <option value="other">📦 Other</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-gray-900">Category/Brand</Label>
                                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Apple, Samsung" />
                                </div>
                                <div>
                                    <Label className="text-gray-900">HSN Code (for tax)</Label>
                                    <Input value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} placeholder="e.g. 84143011" />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-gray-900">Description</Label>
                                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                {/* Dynamic fields based on product type */}
                                {productCategory === 'phone' && (
                                    <>
                                        <div>
                                            <Label className="text-gray-900">Storage *</Label>
                                            <Input value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} placeholder="e.g. 128GB, 256GB" required />
                                        </div>
                                        <div>
                                            <Label className="text-gray-900">RAM *</Label>
                                            <Input value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} placeholder="e.g. 4GB, 8GB" required />
                                        </div>
                                    </>
                                )}

                                {productCategory === 'laptop' && (
                                    <>
                                        <div>
                                            <Label className="text-gray-900">Storage *</Label>
                                            <Input value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} placeholder="e.g. 512GB SSD" required />
                                        </div>
                                        <div>
                                            <Label className="text-gray-900">RAM *</Label>
                                            <Input value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} placeholder="e.g. 8GB, 16GB" required />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-gray-900">Processor *</Label>
                                            <Input value={formData.processor} onChange={(e) => setFormData({ ...formData, processor: e.target.value })} placeholder="e.g. Intel i5, Apple M1" required />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-gray-900">Graphics Card (GPU) *</Label>
                                            <Input value={formData.gpu} onChange={(e) => setFormData({ ...formData, gpu: e.target.value })} placeholder="e.g. NVIDIA RTX 3050, Integrated" required />
                                        </div>
                                    </>
                                )}

                                {productCategory === 'other' && (
                                    <div className="col-span-2">
                                        <Label className="text-gray-900">Specifications</Label>
                                        <Input value={formData.specifications} onChange={(e) => setFormData({ ...formData, specifications: e.target.value })} placeholder="Any specific details" />
                                    </div>
                                )}

                                {/* Pricing Section */}
                                <div className="col-span-2">
                                    <hr className="my-2" />
                                    <h3 className="font-bold text-gray-900 mb-2">💰 Pricing</h3>
                                </div>

                                <div>
                                    <Label className="text-gray-900">MRP (incl. GST) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.mrp}
                                        onChange={(e) => handleMRPChange(e.target.value)}
                                        placeholder="e.g. 11800.00"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maximum Retail Price (includes 18% GST)</p>
                                </div>
                                <div>
                                    <Label className="text-gray-900">Base Price (excl. GST)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.base_price}
                                        disabled
                                        className="bg-gray-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Auto-calculated from MRP</p>
                                </div>
                                <div>
                                    <Label className="text-gray-900">Min Selling Price *</Label>
                                    <Input type="number" step="0.01" value={formData.min_price} onChange={(e) => setFormData({ ...formData, min_price: e.target.value })} placeholder="Minimum you'll sell for" required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Max Selling Price *</Label>
                                    <Input type="number" step="0.01" value={formData.max_price} onChange={(e) => setFormData({ ...formData, max_price: e.target.value })} placeholder="Maximum you'll sell for" required />
                                </div>
                                <div>
                                    <Label className="text-gray-900">Unit</Label>
                                    <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, box, etc." />
                                </div>
                                <div className="col-span-2 flex gap-2">
                                    <Button type="submit">{editingId ? 'Update Product' : 'Save Product'}</Button>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowAddForm(false)
                                        setEditingId(null)
                                        setFormData({ name: '', description: '', specifications: '', category: '', mrp: '', base_price: '', min_price: '', max_price: '', unit: '', sku: '', hsn_code: '', is_active: true, storage: '', ram: '', processor: '', gpu: '' })
                                    }}>Cancel</Button>
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
