"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Sparkles, Loader2, Upload, Image as ImageIcon, X, Star } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { getNutritionalValues } from '@/ai/flows/nutritional-values-flow'
import { toast } from '@/hooks/use-toast'
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore'
import { deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { cn } from '@/lib/utils'

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  // Guard: Only run queries when auth is ready and component is mounted
  const isReady = mounted && !isUserLoading && !!user && !user.isAnonymous

  const staffRef = useMemoFirebase(() => isReady ? doc(db, 'staffUsers', user.uid) : null, [db, user, isReady])
  const { data: profile } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const productsQuery = useMemoFirebase(() => isReady ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, isReady])
  const categoriesQuery = useMemoFirebase(() => isReady ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db, isReady])

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery)
  const { data: categories } = useCollection(categoriesQuery)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    pricePerUnit: '',
    unitOfMeasure: 'kg',
    currentStockQuantity: '',
    lowStockThreshold: '10',
    isPopular: false,
    imageUrl: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleEditClick = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      pricePerUnit: product.pricePerUnit?.toString() || '',
      unitOfMeasure: product.unitOfMeasure || 'kg',
      currentStockQuantity: product.currentStockQuantity?.toString() || '',
      lowStockThreshold: product.lowStockThreshold?.toString() || '10',
      isPopular: !!product.isPopular,
      imageUrl: product.imageUrl || '',
      calories: product.nutritionalValues?.calories || '',
      protein: product.nutritionalValues?.protein || '',
      carbs: product.nutritionalValues?.carbs || '',
      fat: product.nutritionalValues?.fat || ''
    })
    setLocalPreview(product.imageUrl || null)
    setOpen(true)
  }

  const handleAutofillNutrition = async () => {
    if (!formData.name) {
      toast({ title: "Product name required", description: "Please enter a product name first.", variant: "destructive" })
      return
    }
    setIsAiLoading(true)
    try {
      const nutrition = await getNutritionalValues({ name: formData.name, description: formData.description })
      setFormData(prev => ({ ...prev, ...nutrition }))
      toast({ title: "Magic happened! ✨", description: `Nutrition estimated for ${formData.name}.` })
    } catch (error) {
      toast({ title: "AI failed", description: "Could not estimate nutrition automatically.", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (localPreview && !localPreview.startsWith('http')) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'firebase_upload');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dzytzdamb/image/upload`, {
        method: 'POST',
        body: uploadData
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      toast({ title: "Success", description: "Image uploaded successfully." });
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.categoryId || !formData.pricePerUnit) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        unitOfMeasure: formData.unitOfMeasure,
        currentStockQuantity: parseFloat(formData.currentStockQuantity || '0'),
        lowStockThreshold: parseFloat(formData.lowStockThreshold || '10'),
        isPopular: formData.isPopular,
        updatedAt: serverTimestamp(),
        nutritionalValues: {
          calories: formData.calories,
          protein: formData.protein,
          carbs: formData.carbs,
          fat: formData.fat
        }
      }

      if (editingProduct) {
        updateDocumentNonBlocking(doc(db, 'products', editingProduct.id), productData)
        toast({ title: "Updated", description: "Product has been updated." })
      } else {
        const productRef = doc(collection(db, 'products'))
        setDocumentNonBlocking(productRef, {
          ...productData,
          id: productRef.id,
          createdAt: serverTimestamp()
        }, { merge: true })
        toast({ title: "Created", description: "New product added to inventory." })
      }
      setOpen(false)
      resetForm()
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    if (localPreview && !localPreview.startsWith('http')) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      pricePerUnit: '',
      unitOfMeasure: 'kg',
      currentStockQuantity: '',
      lowStockThreshold: '10',
      isPopular: false,
      imageUrl: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    })
  }

  const handleStockAdjustment = (product: any, type: 'STOCK_IN' | 'STOCK_OUT_WASTE', quantity: number) => {
    const transactionRef = doc(collection(db, 'stockTransactions'))
    const quantityChange = type === 'STOCK_IN' ? quantity : -quantity
    
    setDocumentNonBlocking(transactionRef, {
      id: transactionRef.id,
      productId: product.id,
      staffUserId: user?.uid || 'system',
      transactionType: type,
      quantityChange,
      transactionDate: serverTimestamp(),
      unitCostAtTransaction: product.pricePerUnit,
      reason: type === 'STOCK_OUT_WASTE' ? 'Quick waste entry' : 'Quick stock entry'
    }, { merge: true })

    updateDocumentNonBlocking(doc(db, 'products', product.id), {
      currentStockQuantity: (product.currentStockQuantity || 0) + quantityChange,
      updatedAt: serverTimestamp()
    })

    toast({ title: "Inventory Updated", description: `${product.name} stock adjusted by ${quantityChange}.` })
  }

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteDocumentNonBlocking(doc(db, 'products', id))
      toast({ title: "Product Deleted", description: "The product has been removed from the catalog." })
    }
  }

  if (!mounted || isUserLoading || !user || user.isAnonymous) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground">Manage your product catalog and real-time stock levels.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <form onSubmit={handleSaveProduct}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>Fill in the product details below. You can use AI to estimate nutritional values.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[75vh] pr-4">
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input id="name" placeholder="e.g., Red Onion" required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.categoryId} onValueChange={(val) => setFormData(p => ({ ...p, categoryId: val }))}>
                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                          <SelectContent>
                            {categories?.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Brief details about the product..." className="h-24" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                        <Switch 
                          id="popular" 
                          checked={formData.isPopular} 
                          onCheckedChange={(val) => setFormData(p => ({ ...p, isPopular: val }))} 
                        />
                        <Label htmlFor="popular" className="flex items-center gap-2 cursor-pointer">
                          <Star className={cn("h-4 w-4", formData.isPopular ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                          Mark as Popular Now
                        </Label>
                      </div>
                    </div>

                    {/* Right Column: Image & Settings */}
                    <div className="space-y-4">
                      <Label>Product Image</Label>
                      <div 
                        className="border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center bg-muted/50 overflow-hidden relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {localPreview ? (
                          <>
                            <img src={localPreview} alt="Preview" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Click to upload</span>
                          </>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleCloudinaryUpload} />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (₱) *</Label>
                          <Input id="price" type="number" step="0.01" required value={formData.pricePerUnit} onChange={e => setFormData(p => ({ ...p, pricePerUnit: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Select value={formData.unitOfMeasure} onValueChange={v => setFormData(p => ({ ...p, unitOfMeasure: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kilogram (kg)</SelectItem>
                              <SelectItem value="g">gram (g)</SelectItem>
                              <SelectItem value="piece">piece (pc)</SelectItem>
                              <SelectItem value="bunch">bunch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Nutritional Values Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-bold">Nutritional Values (100g)</Label>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleAutofillNutrition} disabled={isAiLoading || !formData.name}>
                        {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-accent" />}
                        AI Estimate
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Calories</Label>
                        <Input placeholder="e.g., 18kcal" value={formData.calories} onChange={e => setFormData(p => ({ ...p, calories: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Protein</Label>
                        <Input placeholder="e.g., 0.9g" value={formData.protein} onChange={e => setFormData(p => ({ ...p, protein: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Carbs</Label>
                        <Input placeholder="e.g., 3.9g" value={formData.carbs} onChange={e => setFormData(p => ({ ...p, carbs: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Fat</Label>
                        <Input placeholder="e.g., 0.2g" value={formData.fat} onChange={e => setFormData(p => ({ ...p, fat: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Stock Management */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Initial Stock Level</Label>
                      <Input id="stock" type="number" value={formData.currentStockQuantity} onChange={e => setFormData(p => ({ ...p, currentStockQuantity: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Low Stock Alert Threshold</Label>
                      <Input id="threshold" type="number" value={formData.lowStockThreshold} onChange={e => setFormData(p => ({ ...p, lowStockThreshold: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving || isUploading} className="min-w-[120px]">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products by name..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" className="gap-2 h-11">
          <Filter className="h-4 w-4" /> Filter Categories
        </Button>
      </div>

      {productsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const category = categories?.find(c => c.id === product.categoryId)
            const isLowStock = (product.currentStockQuantity || 0) <= (product.lowStockThreshold || 10)
            
            return (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border-none shadow-md ring-1 ring-border">
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img src={product.imageUrl || 'https://picsum.photos/seed/produce/600/400'} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {product.isPopular && (
                      <Badge className="bg-yellow-400 text-yellow-950 border-none flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-950" /> POPULAR
                      </Badge>
                    )}
                    {isLowStock && <Badge className="bg-destructive text-destructive-foreground">LOW STOCK</Badge>}
                    {product.currentStockQuantity <= 0 && <Badge variant="outline" className="bg-background/80 backdrop-blur-md">OUT OF STOCK</Badge>}
                  </div>
                </div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 overflow-hidden">
                      <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                      <CardDescription>{category?.name || 'Uncategorized'}</CardDescription>
                    </div>
                    {isAdmin && (
                      <div className="ml-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(product)} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDeleteProduct(product.id, product.name)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-black text-primary">₱{product.pricePerUnit}</p>
                      <p className="text-xs text-muted-foreground">per {product.unitOfMeasure}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-bold", isLowStock ? "text-destructive" : "text-foreground")}>
                        {product.currentStockQuantity}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">In Stock</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleStockAdjustment(product, 'STOCK_IN', 1)}
                  >
                    Stock In
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleStockAdjustment(product, 'STOCK_OUT_WASTE', 1)}
                  >
                    Waste
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      {!productsLoading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <ImageIcon className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-bold">No products found</h3>
          <p className="max-w-xs">We couldn't find any products matching your search terms.</p>
        </div>
      )}
    </div>
  )
}
