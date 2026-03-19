
"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, MessageSquare, Loader2, ExternalLink, Search, AlertCircle } from "lucide-react"
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
  const { data: profile } = useDoc(staffRef)
  
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || user?.email === 'markken@gulayan.ph'

  const reviewsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc')) : null,
    [db, isAuthenticated]
  )
  const { data: reviews, isLoading, error } = useCollection(reviewsQuery)

  const filteredReviews = reviews?.filter(r => 
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (productId: string, reviewId: string) => {
    if (!isAdmin) return
    try {
      await deleteDoc(doc(db, 'products', productId, 'reviews', reviewId))
      toast({ title: "Review Deleted", description: "Feedback has been removed." })
    } catch (e) {
      toast({ title: "Error", description: "Could not delete review.", variant: "destructive" })
    }
  }

  if (!mounted || isUserLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
  
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Index Required</AlertTitle>
          <AlertDescription>
            The review dashboard requires a Firestore collection group index. 
            If this is the first time you are viewing this page, please click the link in your browser console to create the index.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews?.map((review) => (
                <TableRow key={review.id} className="group">
                  <TableCell className="font-bold text-primary">
                    <Link href={`/products/${review.productId}`} className="flex items-center gap-2 hover:underline">
                      {review.productName || 'View Product'} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{review.userName}</div>
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
                    <p className="text-xs truncate">{review.comment}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(review.productId, review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell>
                </TableRow>
              )}
              {!isLoading && filteredReviews?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">No reviews found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
