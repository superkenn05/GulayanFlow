
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
  Trash2,
  ChevronRight
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
  const [mounted, setMounted] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous

  const productRef = useMemoFirebase(() => 
    isAuthenticated ? doc(db, 'products', productId) : null, 
    [db, productId, isAuthenticated]
  )
  const { data: productData, isLoading: productLoading } = useDoc(productRef)
  
  // Directly fetching from the subcollection - this does NOT require a composite index
  const reviewsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collection(db, 'products', productId, 'reviews'), orderBy('createdAt', 'desc')) : null, 
    [db, productId, isAuthenticated]
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
      console.error("Review error:", error)
      toast({ title: "Error", description: "Could not post review. Please try again.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = (reviewId: string) => {
    deleteDocumentNonBlocking(doc(db, 'products', productId, 'reviews', reviewId))
    toast({ title: "Review Removed" })
  }

  if (!mounted || isUserLoading || productLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!productData && !productLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center">
        <Package className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground mt-2">The item you are looking for may have been removed or the ID is invalid.</p>
        <Button asChild className="mt-6" variant="outline"><Link href="/inventory">Back to Inventory</Link></Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen pb-32 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
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
      <div className="relative aspect-video w-full px-4 mt-2 overflow-hidden">
        <Image
          src={product.imageUrl || 'https://picsum.photos/seed/produce/800/600'}
          alt={product.name}
          fill
          className="object-cover rounded-3xl shadow-sm ring-1 ring-black/5"
          priority
        />
      </div>

      {/* Content Section */}
      <div className="px-6 py-8 space-y-10">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold uppercase text-[10px] px-3 tracking-widest">
              {category?.name || 'PRODUCE'}
            </Badge>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-foreground">{reviews?.length || 0}</span> ({reviews?.length || 0} REVIEWS)
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">{product.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold tracking-tight">
              <span>Per {product.unitOfMeasure || 'piece'}</span>
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-1.5 text-primary">
                <Package className="h-3.5 w-3.5" />
                {product.currentStockQuantity || 0} UNITS AVAILABLE
              </div>
            </div>
          </div>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between bg-muted/10 p-5 rounded-[2.5rem] border border-dashed border-primary/20">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Unit Price</p>
            <p className="text-4xl font-black text-primary">₱{product.pricePerUnit || product.price}.00</p>
          </div>
          
          <div className="flex items-center gap-4 bg-background p-2.5 rounded-[1.8rem] shadow-sm ring-1 ring-black/5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-2xl bg-muted/30 hover:bg-muted/50"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-black w-8 text-center">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="h-1 w-6 bg-primary rounded-full" />
             <h2 className="text-2xl font-black tracking-tight uppercase">Description</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {product.description || "Fresh and seasonal harvest, carefully picked to ensure the best quality and taste for your table."}
          </p>
        </div>

        {/* Nutritional Values */}
        {product.nutritionalValues && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight uppercase">Nutrition (100g)</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'CAL', value: product.nutritionalValues.calories, color: 'text-green-600' },
                { label: 'PRO', value: product.nutritionalValues.protein, color: 'text-primary' },
                { label: 'CARBS', value: product.nutritionalValues.carbs, color: 'text-green-600' },
                { label: 'FAT', value: product.nutritionalValues.fat, color: 'text-green-600' },
              ].map((item) => (
                <div key={item.label} className="bg-muted/10 rounded-3xl p-4 flex flex-col items-center justify-center space-y-2 border border-transparent hover:border-primary/20 transition-all">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  <span className={`text-xs font-black ${item.color}`}>{item.value || '0g'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="space-y-8 pt-8 border-t border-dashed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black tracking-tight uppercase">Reviews</h2>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{reviews?.length || 0} COMMENTS</span>
          </div>

          {/* Review Input Box */}
          {!user?.isAnonymous && (
            <div className="p-6 rounded-[2.5rem] border border-dashed border-muted-foreground/30 bg-muted/5 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">YOUR RATING:</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <Star 
                        className={`h-5 w-5 transition-colors ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <Textarea 
                  placeholder="Tell us about the quality of this produce..." 
                  className="rounded-3xl border-none bg-background p-6 pr-14 text-sm font-medium focus-visible:ring-primary/20 min-h-[140px] shadow-sm"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <Button 
                  size="icon" 
                  className="absolute bottom-4 right-4 h-12 w-12 rounded-2xl shadow-xl shadow-primary/30"
                  disabled={!reviewText.trim() || reviewRating === 0 || isSubmitting}
                  onClick={handleSaveReview}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {reviewsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin opacity-10" />
              </div>
            ) : reviews?.map((review) => (
              <div key={review.id} className="bg-muted/10 p-5 rounded-[2rem] border border-transparent hover:border-black/5 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-1 ring-black/5">
                      <AvatarFallback className="text-[10px] font-bold">{review.userName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight">{review.userName}</span>
                        <div className="flex gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                            ))}
                        </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'JUST NOW'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed pl-11">{review.comment}</p>
                {(user?.uid === review.userId || user?.email === 'markken@gulayan.ph') && (
                  <div className="flex justify-end mt-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        onClick={() => handleDeleteReview(review.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {!reviewsLoading && reviews?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center opacity-30 border-2 border-dashed rounded-[3rem]">
                <MessageSquare className="h-10 w-10 mb-3" />
                <p className="text-sm font-black uppercase tracking-widest">No feedback yet</p>
                <p className="text-[10px] font-bold">Be the first to rate this harvest!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Add to Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-50">
        <div className="max-w-md mx-auto flex gap-4">
          <div className="relative">
            <Button variant="outline" size="icon" className="h-16 w-16 rounded-3xl border-2 hover:bg-muted/10 transition-colors shadow-lg shadow-black/5">
              <ShoppingBag className="h-7 w-7" />
            </Button>
            <Badge className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-destructive text-destructive-foreground border-2 border-background flex items-center justify-center p-0 font-bold text-[10px]">
              0
            </Badge>
          </div>
          <Button className="flex-1 h-16 rounded-3xl text-lg font-black shadow-2xl shadow-primary/20 uppercase tracking-widest flex items-center justify-between px-8 group">
            <span>Add to Cart</span>
            <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
