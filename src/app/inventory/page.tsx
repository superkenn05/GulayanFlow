"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Sparkles, Loader2 } from "lucide-react"
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../lib/mock-data'
import Image from 'next/image'
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
import { getNutritionalValues } from '@/ai/flows/nutritional-values-flow'
import { toast } from '@/hooks/use-toast'

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  const filteredProducts = MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      console.error("AI Autofill failed:", error)
      toast({
        title: "AI failed",
        description: "Could not estimate nutrition. Please fill manually.",
        variant: "destructive"
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground">Manage your product catalog and current stock.</p>
        </div>
        <Dialog onOpenChange={(open) => {
          if (!open) setFormData({ name: '', description: '', calories: '', protein: '', carbs: '', fat: '' })
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details for the new inventory item.
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
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_CATEGORIES.map(c => (
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
                      <Input 
                        id="calories" 
                        className="col-span-3" 
                        placeholder="18kcal" 
                        value={formData.calories}
                        onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label htmlFor="protein" className="text-right text-xs">Protein</Label>
                      <Input 
                        id="protein" 
                        className="col-span-3" 
                        placeholder="0.9g" 
                        value={formData.protein}
                        onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label htmlFor="carbs" className="text-right text-xs">Carbs</Label>
                      <Input 
                        id="carbs" 
                        className="col-span-3" 
                        placeholder="3.9g" 
                        value={formData.carbs}
                        onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label htmlFor="fat" className="text-right text-xs">Fat</Label>
                      <Input 
                        id="fat" 
                        className="col-span-3" 
                        placeholder="0.2g" 
                        value={formData.fat}
                        onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Pricing & Stock</h3>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price (₱)</Label>
                    <Input id="price" type="number" className="col-span-3" placeholder="45.00" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">Unit</Label>
                    <Select defaultValue="kg">
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
                    <Label htmlFor="stock" className="text-right">Initial Stock</Label>
                    <Input id="stock" type="number" className="col-span-3" placeholder="100" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Media</h3>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right">Image URL</Label>
                    <Input id="image" className="col-span-3" placeholder="https://..." />
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button type="submit" className="w-full">Save Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const category = MOCK_CATEGORIES.find(c => c.id === product.categoryId)
          return (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border-none bg-white shadow-sm ring-1 ring-border">
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  data-ai-hint="vegetable fruit produce"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={`${
                    product.status === 'in-stock' ? 'bg-green-500 hover:bg-green-600' :
                    product.status === 'low-stock' ? 'bg-orange-500 hover:bg-orange-600' :
                    'bg-red-500 hover:bg-red-600'
                  } text-white border-none shadow-sm`}>
                    {product.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-headline font-bold">{product.name}</CardTitle>
                    <CardDescription>{category?.name}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Price</p>
                    <p className="text-xl font-bold text-primary">₱{product.price}<span className="text-xs font-normal text-muted-foreground ml-1">/ {product.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Stock</p>
                    <p className={`text-xl font-bold ${product.currentStock < 10 ? 'text-destructive' : ''}`}>{product.currentStock} <span className="text-xs font-normal">{product.unit}</span></p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-muted/30 border-t flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-white">Stock In</Button>
                <Button variant="outline" size="sm" className="flex-1 bg-white">Waste</Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
