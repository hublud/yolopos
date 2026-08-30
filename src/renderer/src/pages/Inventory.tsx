import { useState, useEffect } from 'react'
import { Package, Search, Plus, Edit2, X, TrendingUp, Image as ImageIcon, Layers, Trash2 } from 'lucide-react'
import { ProductImage } from '../components/ProductImage'

export interface VariantItem {
  id: string
  name: string
  price: number
  active: boolean
}

export function Inventory() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  const initialCategories = ['Mains', 'Combo Deals', 'Burgers', 'Small Chops', 'Proteins', 'Extras', 'Loaded Fries', 'Pizza', 'Shawarma', 'Mocktail', 'Cocktail', 'Milkshake', 'Smoothie', 'Parfait', 'Drinks']
  const categoriesList = Array.from(new Set([...initialCategories, ...products.map((p: any) => p.category)]))

  // Common loading state
  const [loading, setLoading] = useState(false)

  // Add Product Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('5000')
  const [newCategory, setNewCategory] = useState('Mains')
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [newStock, setNewStock] = useState('50')
  const [newImage, setNewImage] = useState('')
  const [newVariants, setNewVariants] = useState<VariantItem[]>([])

  // Edit Product Modal States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId] = useState('')
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('5000')
  const [editCategory, setEditCategory] = useState('Mains')
  const [isEditingNewCategory, setIsEditingNewCategory] = useState(false)
  const [editCustomCategory, setEditCustomCategory] = useState('')
  const [editImage, setEditImage] = useState('')
  const [editVariants, setEditVariants] = useState<VariantItem[]>([])

  // Adjust Stock Modal States
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [adjustChange, setAdjustChange] = useState('')
  const [adjustReason, setAdjustReason] = useState('restock')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      // @ts-ignore
      const data = await window.api.getProducts()
      setProducts(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (isEdit) {
          setEditImage(reader.result as string)
        } else {
          setNewImage(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Variant Helpers for Add Modal
  const addVariantRowToAdd = () => {
    setNewVariants(prev => [
      ...prev,
      {
        id: 'var-' + Math.random().toString(36).substring(2, 7),
        name: '',
        price: Number(newPrice) || 0,
        active: true
      }
    ])
  }

  const updateVariantInAdd = (index: number, field: keyof VariantItem, value: any) => {
    setNewVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const removeVariantFromAdd = (index: number) => {
    setNewVariants(prev => prev.filter((_, i) => i !== index))
  }

  // Variant Helpers for Edit Modal
  const addVariantRowToEdit = () => {
    setEditVariants(prev => [
      ...prev,
      {
        id: 'var-' + Math.random().toString(36).substring(2, 7),
        name: '',
        price: Number(editPrice) || 0,
        active: true
      }
    ])
  }

  const updateVariantInEdit = (index: number, field: keyof VariantItem, value: any) => {
    setEditVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const removeVariantFromEdit = (index: number) => {
    setEditVariants(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const categoryToUse = isCreatingNewCategory ? customCategory.trim() : newCategory
    if (!newName || !newPrice || !newStock || !categoryToUse) return
    setLoading(true)
    try {
      const payload = {
        name: newName,
        price: parseFloat(newPrice),
        category: categoryToUse,
        image: newImage || 'drink.png',
        stock: parseInt(newStock),
        variants: newVariants.filter(v => v.name.trim().length > 0)
      }
      // @ts-ignore
      const result = await window.api.addProduct(payload)
      if (result.success) {
        setNewName('')
        setNewPrice('5000')
        setNewStock('50')
        setNewCategory('Mains')
        setCustomCategory('')
        setNewImage('')
        setNewVariants([])
        setIsCreatingNewCategory(false)
        setShowAddModal(false)
        await loadProducts()
      } else {
        alert('Failed to add product: ' + result.error)
      }
    } catch (err) {
      alert('Error adding product.')
    }
    setLoading(false)
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const categoryToUse = isEditingNewCategory ? editCustomCategory.trim() : editCategory
    if (!editId || !editName || !editPrice || !categoryToUse) return
    setLoading(true)
    try {
      const payload = {
        name: editName,
        price: parseFloat(editPrice),
        category: categoryToUse,
        image: editImage || 'drink.png',
        variants: editVariants.filter(v => v.name.trim().length > 0)
      }
      // @ts-ignore
      const result = await window.api.updateProduct(editId, payload)
      if (result.success) {
        setEditId('')
        setEditName('')
        setEditPrice('5000')
        setEditCategory('Mains')
        setEditImage('')
        setEditVariants([])
        setEditCustomCategory('')
        setIsEditingNewCategory(false)
        setShowEditModal(false)
        await loadProducts()
      } else {
        alert('Failed to update product: ' + result.error)
      }
    } catch (err) {
      alert('Error updating product.')
    }
    setLoading(false)
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !adjustChange) return
    setLoading(true)
    try {
      const payload = {
        productId: selectedProduct.id,
        change: parseInt(adjustChange),
        reason: adjustReason
      }
      // @ts-ignore
      const result = await window.api.updateProductStock(payload)
      if (result.success) {
        setAdjustChange('')
        setAdjustReason('restock')
        setShowAdjustModal(false)
        setSelectedProduct(null)
        await loadProducts()
      } else {
        alert('Failed to adjust stock: ' + result.error)
      }
    } catch (err) {
      alert('Error adjusting stock.')
    }
    setLoading(false)
  }

  const openEditModal = (p: any) => {
    setEditId(p.id)
    setEditName(p.name)
    setEditPrice(p.price.toString())
    setEditCategory(p.category)
    setEditImage(p.image)
    setEditVariants(p.variants ? JSON.parse(JSON.stringify(p.variants)) : [])
    setEditCustomCategory('')
    setIsEditingNewCategory(false)
    setShowEditModal(true)
  }

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yolo-dark">Inventory Management</h2>
        <button 
          onClick={() => {
            setNewVariants([])
            setShowAddModal(true)
          }}
          className="bg-yolo-red text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yolo-red focus:border-transparent text-sm transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Item Info</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price / Options</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredProducts.map((p: any) => {
                const variants = (p.variants || []).filter((v: any) => v.active !== false)
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                        <ProductImage image={p.image} category={p.category} />
                      </div>
                      <div>
                        <span>{p.name}</span>
                        {variants.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {variants.map((v: any) => (
                              <span key={v.id || v.name} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                {v.name}: ₦{Number(v.price).toLocaleString()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.category}</td>
                    <td className="px-6 py-4 font-bold text-yolo-dark">
                      {variants.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span>From ₦{Math.min(...variants.map(v => Number(v.price))).toLocaleString()}</span>
                          <span className="bg-orange-50 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {variants.length} Variants
                          </span>
                        </div>
                      ) : (
                        `₦${Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.stock > 10 ? 'bg-green-100 text-green-700' : 
                        p.stock > 0 ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-yolo-red'
                      }`}>
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-2 text-gray-400 hover:text-yolo-dark hover:bg-gray-100 bg-white shadow-sm border border-gray-100 rounded-lg transition-all active:scale-95"
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProduct(p)
                            setShowAdjustModal(true)
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 bg-white shadow-sm border border-gray-100 rounded-lg transition-all active:scale-95"
                          title="Adjust Stock"
                        >
                          <TrendingUp size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <Package className="mx-auto mb-3 opacity-50" size={48} />
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button 
              onClick={() => {
                setShowAddModal(false)
                setNewImage('')
                setNewVariants([])
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yolo-dark mb-4">Add New Product</h3>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Pepperoni Pizza"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Image (Optional)</label>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {newImage ? (
                      <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-300" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="add-image-input" className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                      <ImageIcon size={14} />
                      Choose Image File
                    </label>
                    <input 
                      id="add-image-input"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                    {newImage && (
                      <button 
                        type="button" 
                        onClick={() => setNewImage('')}
                        className="text-yolo-red text-xs font-bold block mt-1 hover:underline text-left"
                      >
                        Remove Image
                      </button>
                    )}
                    {!newImage && <span className="text-[10px] text-gray-400 block mt-1">Leave empty to use category fallback emoji</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select 
                  value={isCreatingNewCategory ? 'NEW_CATEGORY' : newCategory}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'NEW_CATEGORY') {
                      setIsCreatingNewCategory(true)
                    } else {
                      setNewCategory(val)
                      setIsCreatingNewCategory(false)
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all bg-white"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="NEW_CATEGORY">+ Add New Category...</option>
                </select>
              </div>

              {isCreatingNewCategory && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Category Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Specials"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price (₦)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="5000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    required
                    placeholder="50"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Product Variants Section */}
              <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-yolo-red" />
                    <span className="text-sm font-bold text-gray-800">Product Variants / Options (Optional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRowToAdd}
                    className="text-xs font-bold text-yolo-red hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Variant
                  </button>
                </div>
                
                {newVariants.map((v, i) => (
                  <div key={v.id || i} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      placeholder="Variant Name (e.g. Large)"
                      value={v.name}
                      onChange={(e) => updateVariantInAdd(i, 'name', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-yolo-red"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => updateVariantInAdd(i, 'price', Number(e.target.value))}
                      className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-yolo-red"
                    />
                    <label className="flex items-center gap-1 text-[11px] font-medium text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.active !== false}
                        onChange={(e) => updateVariantInAdd(i, 'active', e.target.checked)}
                        className="rounded text-yolo-red focus:ring-yolo-red"
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removeVariantFromAdd(i)}
                      className="text-gray-400 hover:text-yolo-red p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {newVariants.length === 0 && (
                  <p className="text-[11px] text-gray-400 italic">No variants added. Product will use the single base price.</p>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-yolo-red text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button 
              onClick={() => {
                setShowEditModal(false)
                setEditId('')
                setEditImage('')
                setEditVariants([])
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yolo-dark mb-4">Edit Product Details</h3>
            <form onSubmit={handleEditProduct} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Pepperoni Pizza"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Image</label>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    <ProductImage image={editImage} category={isEditingNewCategory ? editCustomCategory : editCategory} />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="edit-image-input" className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                      <ImageIcon size={14} />
                      Change Image File
                    </label>
                    <input 
                      id="edit-image-input"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                    {editImage && editImage !== 'drink.png' && (
                      <button 
                        type="button" 
                        onClick={() => setEditImage('drink.png')}
                        className="text-yolo-red text-xs font-bold block mt-1 hover:underline text-left"
                      >
                        Reset to Default
                      </button>
                    )}
                    {(!editImage || editImage === 'drink.png') && (
                      <span className="text-[10px] text-gray-400 block mt-1">Currently using category fallback emoji</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select 
                  value={isEditingNewCategory ? 'NEW_CATEGORY' : editCategory}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'NEW_CATEGORY') {
                      setIsEditingNewCategory(true)
                    } else {
                      setEditCategory(val)
                      setIsEditingNewCategory(false)
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all bg-white"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="NEW_CATEGORY">+ Add New Category...</option>
                </select>
              </div>

              {isEditingNewCategory && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Category Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Specials"
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price (₦)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="5000"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>

              {/* Product Variants Section */}
              <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-yolo-red" />
                    <span className="text-sm font-bold text-gray-800">Product Variants / Options</span>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRowToEdit}
                    className="text-xs font-bold text-yolo-red hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Variant
                  </button>
                </div>
                
                {editVariants.map((v, i) => (
                  <div key={v.id || i} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      placeholder="Variant Name (e.g. Large)"
                      value={v.name}
                      onChange={(e) => updateVariantInEdit(i, 'name', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-yolo-red"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => updateVariantInEdit(i, 'price', Number(e.target.value))}
                      className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-yolo-red"
                    />
                    <label className="flex items-center gap-1 text-[11px] font-medium text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.active !== false}
                        onChange={(e) => updateVariantInEdit(i, 'active', e.target.checked)}
                        className="rounded text-yolo-red focus:ring-yolo-red"
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removeVariantFromEdit(i)}
                      className="text-gray-400 hover:text-yolo-red p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {editVariants.length === 0 && (
                  <p className="text-[11px] text-gray-400 italic">No variants. Product will use the single base price.</p>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-yolo-red text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Product Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setShowAdjustModal(false)
                setSelectedProduct(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yolo-dark mb-2">Adjust Stock</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedProduct.name} (Current: {selectedProduct.stock})</p>
            <form onSubmit={handleAdjustStock} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Change (Use negative for reductions)</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 10 or -5"
                  value={adjustChange}
                  onChange={(e) => setAdjustChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
                <select 
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yolo-red outline-none text-sm transition-all bg-white"
                >
                  <option value="restock">Restock</option>
                  <option value="spoilage">Spoilage/Waste</option>
                  <option value="correction">Inventory Correction</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-yolo-red text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
