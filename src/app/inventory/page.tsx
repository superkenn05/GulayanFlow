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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const productsQuery = useMemoFirebase(() => query(collection(db, 'products'), orderBy('name', 'asc')), [db])
  const categoriesQuery = useMemoFirebase(() => query(collection(db, 'categories'), orderBy('name', 'asc')), [db])

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
    imageUrl: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

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
      toast({ title: "Product name required", description: "Please enter a product name first.", variant: "destructive" })
      return
    }
    setIsAiLoading(true)
    try {
      const nutrition = await getNutritionalValues({ name: formData.name, description: formData.description })
      setFormData(prev => ({ ...prev, ...nutrition }))
      toast({ title: "Magic happened! ✨", description: `Nutrition filled for ${formData.name}.` })
    } catch (error) {
      toast({ title: "AI failed", description: "Could not estimate nutrition.", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'firebase_upload');
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dzytzdamb/image/upload`, { method: 'POST', body: uploadData });
      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      toast({ title: "Success", description: "Image uploaded." });
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
    } finally { setIsUploading(false); }
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
        nutritionalValues: { calories: formData.calories, protein: formData.protein, carbs: formData.carbs, fat: formData.fat }
      }
      if (editingProduct) {
        updateDocumentNonBlocking(doc(db, 'products', editingProduct.id), productData)
      } else {
        const productRef = doc(collection(db, 'products'))
        setDocumentNonBlocking(productRef, { ...productData, id: productRef.id, createdAt: serverTimestamp() }, { merge: true })
      }
      setOpen(false)
      resetForm()
    } finally { setIsSaving(false) }
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
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSaveProduct}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>Fill in the details for the inventory item.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="grid gap-6 py-4">
                  <div className="space-y-4">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.categoryId} onValueChange={(val) => setFormData(p => ({ ...p, categoryId: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label>Nutrition</Label><Button type="button" size="sm" onClick={handleAutofillNutrition} disabled={isAiLoading}>AI Fill</Button></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Calories" value={formData.calories} onChange={e => setFormData(p => ({ ...p, calories: e.target.value }))} />
                      <Input placeholder="Protein" value={formData.protein} onChange={e => setFormData(p => ({ ...p, protein: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label>Price & Stock</Label>
                    <Input type="number" placeholder="Price (₱)" required value={formData.pricePerUnit} onChange={e => setFormData(p => ({ ...p, pricePerUnit: e.target.value }))} />
                    <Input type="number" placeholder="Initial Stock" value={formData.currentStockQuantity} onChange={e => setFormData(p => ({ ...p, currentStockQuantity: e.target.value }))} />
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter><Button type="submit" disabled={isSaving || isUploading}>Save Product</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {productsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const category = categories?.find(c => c.id === product.categoryId)
            const isLowStock = product.currentStockQuantity <= (product.lowStockThreshold || 10)
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  <img src={product.imageUrl || 'https://picsum.photos/seed/produce/400/300'} alt={product.name} className="h-full w-full object-cover" />
                  {isLowStock && <Badge className="absolute top-2 right-2" variant="destructive">LOW STOCK</Badge>}
                </div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent><DropdownMenuItem onClick={() => handleEditClick(product)}>Edit</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{category?.name}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xl font-bold text-primary">₱{product.pricePerUnit}</p>
                  <p className="text-sm">Stock: {product.currentStockQuantity} {product.unitOfMeasure}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleStockAdjustment(product, 'STOCK_IN', 1)}>Stock In</Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => handleStockAdjustment(product, 'STOCK_OUT_WASTE', 1)}>Waste</Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}