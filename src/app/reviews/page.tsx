
"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, MessageSquare, Loader2, ExternalLink, Search, AlertCircle, RefreshCw } from "lucide-react"
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase'
import { collectionGroup, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ReviewManagementPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous
  
  const staffRef = useMemoFirebase(() => isAuthenticated ? doc(db, 'staffUsers', user.uid) : null, [db, user, isAuthenticated])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)
  
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || user?.email === 'markken@gulayan.ph'

  // Simplified query: Removing orderBy temporarily to see if it fetches without a composite index
  // Note: Collection Group queries often still require a simple index.
  const reviewsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collectionGroup(db, 'reviews')) : null,
    [db, isAuthenticated]
  )
  const { data: reviews, isLoading, error } = useCollection(reviewsQuery)

  const filteredReviews = reviews?.filter(r => 
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Manual sort since we removed it from the query for better compatibility
    const dateA = a.createdAt?.toDate?.() || new Date(0)
    const dateB = b.createdAt?.toDate?.() || new Date(0)
    return dateB.getTime() - dateA.getTime()
  })

  const handleDelete = async (productId: string, reviewId: string) => {
    if (!isAdmin || !productId || !reviewId) {
      toast({ title: "Cannot Delete", description: "Missing required IDs for deletion.", variant: "destructive" })
      return
    }
    try {
      await deleteDoc(doc(db, 'products', productId, 'reviews', reviewId))
      toast({ title: "Review Deleted", description: "Feedback has been removed." })
    } catch (e) {
      toast({ title: "Error", description: "Could not delete review.", variant: "destructive" })
    }
  }

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive opacity-20" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only store administrators can manage customer reviews.</p>
        <Button asChild variant="outline"><Link href="/">Back to Dashboard</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Customer Reviews <MessageSquare className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Monitor and manage customer feedback across all products.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter reviews by product, user, or comment..." 
          className="pl-10 h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Sync Notice</AlertTitle>
          <AlertDescription>
            The aggregate review dashboard requires a <strong>Firestore Collection Group Index</strong> for the "reviews" collection. 
            Please check your browser's developer console (F12) for a direct link to create this index in the Firebase Console.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews?.map((review) => (
                <TableRow key={review.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-primary">
                    <Link href={`/products/${review.productId}`} className="flex items-center gap-2 hover:underline">
                      {review.productName || 'View Product'} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{review.userName || "Guest"}</div>
                    <div className="text-[10px] text-muted-foreground">{review.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs italic leading-tight line-clamp-2">{review.comment}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => handleDelete(review.productId, review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell>
                </TableRow>
              )}
              {!isLoading && filteredReviews?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">No customer reviews found matching your criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
