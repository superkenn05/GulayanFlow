
"use client"

import React, { useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Star, 
  Plus, 
  Minus,
  ArrowRight
} from 'lucide-react'
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/app/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const [quantity, setQuantity] = useState(1)
  const product = MOCK_PRODUCTS.find(p => p.id === productId) || MOCK_PRODUCTS[0]
  const category = MOCK_CATEGORIES.find(c => c.id === product.categoryId)

  if (!product) return <div>Product not found</div>

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen pb-20 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="rounded-full bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-muted">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-muted">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Product Image */}
      <div className="relative aspect-video w-full px-4 mt-2 overflow-hidden rounded-2xl">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover rounded-2xl"
          priority
          data-ai-hint="fresh tomato"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 py-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-medium">
              {category?.name}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <p className="text-muted-foreground font-medium">Per {product.unit}</p>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold bg-muted/50 px-2 py-1 rounded-lg">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{product.rating || '4.8'}</span>
            <span className="text-muted-foreground font-normal">({product.reviewsCount || '124'} reviews)</span>
          </div>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price</p>
            <p className="text-3xl font-bold text-primary">₱{product.price.toFixed(2)}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-muted/30 p-1.5 rounded-2xl ring-1 ring-border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-xl bg-background shadow-sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold w-4 text-center">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-xl bg-background shadow-sm text-primary"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Description</h2>
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Nutritional Values */}
        {product.nutritionalValues && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Nutritional Values (100g)</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'CALORIES', value: product.nutritionalValues.calories, color: 'text-green-600' },
                { label: 'PROTEIN', value: product.nutritionalValues.protein, color: 'text-primary' },
                { label: 'CARBS', value: product.nutritionalValues.carbs, color: 'text-green-600' },
                { label: 'FAT', value: product.nutritionalValues.fat, color: 'text-green-600' },
              ].map((item) => (
                <div key={item.label} className="bg-muted/30 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1 border border-border/50">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">{item.label}</span>
                  <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Related Products</h2>
            <Button variant="ghost" size="sm" className="text-primary font-bold gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {MOCK_PRODUCTS.filter(p => p.id !== product.id).slice(0, 2).map((p) => (
              <Card key={p.id} className="overflow-hidden border-none shadow-sm ring-1 ring-border rounded-2xl">
                <div className="relative aspect-square">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover"
                    data-ai-hint="fresh produce"
                  />
                  <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
                    <Heart className="h-3 w-3" />
                  </Button>
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                    <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                    4.5
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Add to Cart Button (Mobile Style) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
          Add to Cart
        </Button>
      </div>
    </div>
  )
}
