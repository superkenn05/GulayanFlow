
"use client"

import React, { useState, use, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Star, 
  Plus, 
  Minus,
  ArrowRight,
  MessageSquare,
  SendHorizontal,
  ShoppingBag,
  Package,
  Loader2,
  Trash2
} from 'lucide-react'
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/app/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase'
import { collection, query, orderBy, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates'

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const [quantity, setQuantity] = useState(1)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const db = useFirestore()

  const productRef = useMemoFirebase(() => doc(db, 'products', productId), [db, productId])
  const { data: productData, isLoading: productLoading } = useDoc(productRef)
  
  const reviewsQuery = useMemoFirebase(() => 
    query(collection(db, 'products', productId, 'reviews'), orderBy('createdAt', 'desc')), 
    [db, productId]
  )
  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery)

  const product = productData || MOCK_PRODUCTS.find(p => p.id === productId)
  const category = MOCK_CATEGORIES.find(c => c.id === product?.categoryId)

  const handleSaveReview = async () => {
    if (!user || !reviewText.trim() || reviewRating === 0) return
    setIsSubmitting(true)

    try {
      const reviewRef = doc(collection(db, 'products', productId, 'reviews'))
      await setDoc(reviewRef, {
        id: reviewRef.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous Guest',
        userEmail: user.email,
        rating: reviewRating,
        comment: reviewText,
        createdAt: serverTimestamp(),
        productId: productId,
        productName: product?.name || 'Unknown Product'
      })

      toast({ title: "Review Shared", description: "Thank you for your feedback!" })
      setReviewText('')
      setReviewRating(0)
    } catch (error) {
      toast({ title: "Error", description: "Could not post review.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = (reviewId: string) => {
    deleteDocumentNonBlocking(doc(db, 'products', productId, 'reviews', reviewId))
    toast({ title: "Review Removed" })
  }

  if (productLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!product) return <div className="p-10 text-center">Product not found</div>

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen pb-32 animate-in fade-in duration-500">
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
          <Avatar className="h-9 w-9 ring-1 ring-border">
            <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/400`} />
            <AvatarFallback className="bg-primary/5 text-[10px] font-bold">
              {user?.displayName?.substring(0, 1) || 'N'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Product Image */}
      <div className="relative aspect-video w-full px-4 mt-2 overflow-hidden rounded-2xl">
        <Image
          src={product.imageUrl || 'https://picsum.photos/seed/produce/800/600'}
          alt={product.name}
          fill
          className="object-cover rounded-2xl shadow-sm"
          priority
        />
      </div>

      {/* Content Section */}
      <div className="px-6 py-6 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold uppercase text-[10px] px-3">
              {category?.name || 'PRODUCE'}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-foreground">{reviews?.length || 0}</span> ({reviews?.length || 0} REVIEWS)
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <span>Per {product.unitOfMeasure || 'piece'}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-primary font-bold uppercase text-[10px] tracking-widest">
                <Package className="h-3.5 w-3.5" />
                {product.currentStockQuantity || 0} AVAILABLE
              </div>
            </div>
          </div>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between bg-muted/5 p-4 rounded-3xl border border-dashed">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price</p>
            <p className="text-4xl font-black text-primary">₱{product.pricePerUnit || product.price}.00</p>
          </div>
          
          <div className="flex items-center gap-4 bg-background p-2 rounded-2xl shadow-sm ring-1 ring-border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-muted/20"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-black w-6 text-center">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-primary/10 text-primary"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight">Description</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {product.description || "Fresh and seasonal harvest, carefully picked to ensure the best quality and taste for your table."}
          </p>
        </div>

        {/* Nutritional Values */}
        {product.nutritionalValues && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight">Nutritional Values</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'CALORIES', value: product.nutritionalValues.calories, color: 'text-green-600' },
                { label: 'PROTEIN', value: product.nutritionalValues.protein, color: 'text-primary' },
                { label: 'CARBS', value: product.nutritionalValues.carbs, color: 'text-green-600' },
                { label: 'FAT', value: product.nutritionalValues.fat, color: 'text-green-600' },
              ].map((item) => (
                <div key={item.label} className="bg-muted/10 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 border border-transparent hover:border-border transition-colors">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  <span className={`text-xs font-black ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="space-y-6 pt-4 border-t border-dashed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black tracking-tight">Customer Reviews</h2>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{reviews?.length || 0} COMMENTS</span>
          </div>

          {/* Review Input Box */}
          {!user?.isAnonymous && (
            <div className="p-6 rounded-[2.5rem] border border-dashed bg-muted/5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">RATE THIS HARVEST:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <Star 
                        className={`h-5 w-5 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <Textarea 
                  placeholder="Tell us what you think of this produce..." 
                  className="rounded-3xl border-none bg-background p-6 pr-14 text-sm font-medium focus-visible:ring-primary/20 min-h-[120px]"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <Button 
                  size="icon" 
                  className="absolute bottom-4 right-4 h-10 w-10 rounded-2xl shadow-lg shadow-primary/20"
                  disabled={!reviewText.trim() || reviewRating === 0 || isSubmitting}
                  onClick={handleSaveReview}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews?.map((review) => (
              <div key={review.id} className="bg-muted/10 p-4 rounded-2xl border border-transparent hover:border-border transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[8px]">{review.userName?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold">{review.userName}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                {(user?.uid === review.userId || user?.email === 'markken@gulayan.ph') && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive mt-2"
                    onClick={() => handleDeleteReview(review.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {!reviewsLoading && reviews?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <p className="text-sm font-bold text-muted-foreground">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Add to Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-20">
        <div className="max-w-md mx-auto flex gap-4">
          <div className="relative">
            <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2 hover:bg-muted/10 transition-colors">
              <ShoppingBag className="h-6 w-6" />
            </Button>
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground border-2 border-background flex items-center justify-center p-0 font-bold text-[10px]">
              0
            </Badge>
          </div>
          <Button className="flex-1 h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 uppercase tracking-widest">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
