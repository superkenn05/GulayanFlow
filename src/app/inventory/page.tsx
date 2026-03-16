
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Sparkles, Loader2, Upload, Image as ImageIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
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
import { getNutritionalValues } from '@/ai/flows/nutritional-values-flow'
import { toast } from '@/hooks/use-toast'
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const db = useFirestore()
  const { user } = useUser()

  const productsQuery = useMemoFirebase(() => query(collection(db, 'products'), orderBy('name', 'asc')), [db])
  const categoriesQuery = useMemoFirebase(() => query(collection(db, 'categories'), orderBy('name', 'asc')), [db])

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery)
  const { data: categories } = useCollection(categoriesQuery)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    pricePerUnit: '',
    unitOfMeasure: 'kg',
    currentStockQuantity: '',
    lowStockThreshold: '10',
    imageUrl: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  // Cleanup local preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

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
      imageUrl: product.imageUrl || '',
      calories: product.nutritionalValues?.calories || '',
      protein: product.nutritionalValues?.protein || '',
      carbs: product.nutritionalValues?.carbs || '',
      fat: product.nutritionalValues?.fat || ''
    })
    setOpen(true)
  }

  const handleAutofillNutrition = async () => {
    if (!formData.name) {
      toast({
        title: "Product name required",
        description: "Please enter a product name first so AI can estimate its nutrition.",
        variant: "destructive"
      })
      return
    }

    setIsAiLoading(true)
    try {
      const nutrition = await getNutritionalValues({ 
        name: formData.name,
        description: formData.description 
      })
      
      setFormData(prev => ({
        ...prev,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat
      }))

      toast({
        title: "Magic happened! ✨",
        description: `Estimated nutrition for ${formData.name} has been filled.`
      })
    } catch (error) {
      toast({
        title: "AI failed",
        description: "Could not estimate nutrition. Please fill manually.",
        variant: "destructive"
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzytzdamb';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'firebase_upload';

    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully."
      });
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image to Cloudinary.",
        variant: "destructive"
      });
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
        toast({ title: "Updated", description: `${formData.name} information updated.` })
      } else {
        const productRef = doc(collection(db, 'products'))
        setDocumentNonBlocking(productRef, {
          ...productData,
          id: productRef.id,
          createdAt: serverTimestamp()
        }, { merge: true })
        toast({ title: "Success", description: `${formData.name} added to inventory.` })
      }
      
      setOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: "Error", description: "Could not save product.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setLocalPreview(null)
    setFormData({
      name: '', description: '', categoryId: '', pricePerUnit: '', unitOfMeasure: 'kg',
      currentStockQuantity: '', lowStockThreshold: '10', imageUrl: '',
      calories: '', protein: '', carbs: '', fat: ''
    })
  }

  const handleDeleteProduct = (id: string, name: string) => {
    deleteDocumentNonBlocking(doc(db, 'products', id))
    toast({ title: "Deleted", description: `${name} removed from inventory.` })
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
      reason: type === 'STOCK_OUT_WASTE' ? 'Manual waste entry' : 'Manual stock-in'
    }, { merge: true })

    updateDocumentNonBlocking(doc(db, 'products', product.id), {
      currentStockQuantity: (product.currentStockQuantity || 0) + quantityChange,
      updatedAt: serverTimestamp()
    })

    toast({ title: "Stock Updated", description: `${product.name} stock adjusted.` })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground">Manage your product catalog and current stock.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val)
          if (!val) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSaveProduct}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Modify the details of the existing product.' : 'Fill in the details for the new inventory item.'}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="grid gap-6 py-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Basic Information</h3>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input 
                        id="name" 
                        className="col-span-3" 
                        placeholder="e.g. Red Tomatoes" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">Category</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Description</Label>
                      <Textarea 
                        id="description" 
                        className="col-span-3" 
                        placeholder="Fresh and juicy..." 
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Nutritional Values (per 100g)</h3>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 text-xs border-primary/20 hover:bg-primary/5"
                        onClick={handleAutofillNutrition}
                        disabled={isAiLoading}
                      >
                        {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-accent" />}
                        {isAiLoading ? "Consulting AI..." : "Magic Autofill"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid grid-cols-4 items-center gap-2">
                        <Label htmlFor="calories" className="text-right text-xs">Calories</Label>
                        <Input id="calories" className="col-span-3" placeholder="18kcal" value={formData.calories} onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-2">
                        <Label htmlFor="protein" className="text-right text-xs">Protein</Label>
                        <Input id="protein" className="col-span-3" placeholder="0.9g" value={formData.protein} onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-2">
                        <Label htmlFor="carbs" className="text-right text-xs">Carbs</Label>
                        <Input id="carbs" className="col-span-3" placeholder="3.9g" value={formData.carbs} onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-2">
                        <Label htmlFor="fat" className="text-right text-xs">Fat</Label>
                        <Input id="fat" className="col-span-3" placeholder="0.2g" value={formData.fat} onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Pricing & Stock</h3>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">Price (₱)</Label>
                      <Input id="price" type="number" className="col-span-3" placeholder="45.00" required value={formData.pricePerUnit} onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unit" className="text-right">Unit</Label>
                      <Select value={formData.unitOfMeasure} onValueChange={(val) => setFormData(prev => ({ ...prev, unitOfMeasure: val }))}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kilogram (kg)</SelectItem>
                          <SelectItem value="piece">piece</SelectItem>
                          <SelectItem value="bunch">bunch</SelectItem>
                          <SelectItem value="pack">pack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stock" className="text-right">Stock Level</Label>
                      <Input id="stock" type="number" className="col-span-3" placeholder="100" value={formData.currentStockQuantity} onChange={(e) => setFormData(prev => ({ ...prev, currentStockQuantity: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Product Media</h3>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">Image</Label>
                      <div className="col-span-3 space-y-3">
                        <div 
                          className={cn(
                            "relative h-48 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden",
                            (formData.imageUrl || localPreview) ? "border-solid" : "border-muted"
                          )}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {(formData.imageUrl || localPreview) ? (
                            <div className="relative h-full w-full">
                              <img src={localPreview || formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                              {isUploading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 backdrop-blur-[2px]">
                                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                                  <span className="text-xs text-white font-bold bg-black/40 px-2 py-1 rounded">Uploading...</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-3 bg-primary/10 rounded-full"><ImageIcon className="h-6 w-6 text-primary" /></div>
                              <div className="text-center">
                                <p className="text-sm font-medium">Click to upload product image</p>
                                <p className="text-xs text-muted-foreground">Or drag and drop PNG, JPG</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleCloudinaryUpload} />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filter</Button>
      </div>

      {productsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const category = categories?.find(c => c.id === product.categoryId)
            const isLowStock = product.currentStockQuantity <= (product.lowStockThreshold || 10)
            const isOutOfStock = product.currentStockQuantity <= 0

            return (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border-none bg-white shadow-sm ring-1 ring-border">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <img src={product.imageUrl || 'https://picsum.photos/seed/produce/400/300'} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute top-2 right-2">
                    <Badge className={`${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500'} text-white border-none shadow-sm`}>
                      {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-headline font-bold">{product.name}</CardTitle>
                      <CardDescription>{category?.name || 'Uncategorized'}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditClick(product)}>
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteProduct(product.id, product.name)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Price</p>
                      <p className="text-xl font-bold text-primary">₱{product.pricePerUnit}<span className="text-xs font-normal text-muted-foreground ml-1">/ {product.unitOfMeasure}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Stock</p>
                      <p className={`text-xl font-bold ${isLowStock ? 'text-destructive' : ''}`}>{product.currentStockQuantity || 0} <span className="text-xs font-normal">{product.unitOfMeasure}</span></p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/30 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-white" onClick={() => handleStockAdjustment(product, 'STOCK_IN', 1)}>Stock In</Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-white text-destructive hover:text-destructive" onClick={() => handleStockAdjustment(product, 'STOCK_OUT_WASTE', 1)}>Waste</Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
