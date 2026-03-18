
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Eye, Loader2, MapPin, CreditCard, Calendar, User, Search, ChevronRight, CheckCircle2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase'
import { collection, query, orderBy, doc, collectionGroup, serverTimestamp, increment, where } from 'firebase/firestore'
import { Order, UserProfile } from '../types'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { toast } from '@/hooks/use-toast'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous

  // 1. Fetch all User Profiles (Customers)
  const profilesQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collection(db, 'userProfiles')) : null,
    [db, isAuthenticated]
  )
  const { data: profiles, isLoading: profilesLoading } = useCollection<UserProfile>(profilesQuery)

  // 2. Fetch ALL pending orders across all customers for red dot indicators
  // Filtering for 'pending' status requires a COLLECTION_GROUP_ASC index
  const pendingOrdersGroupQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collectionGroup(db, 'orders'),
      where('status', '==', 'pending')
    ) : null,
    [db, isAuthenticated]
  )
  const { data: pendingOrders, error: groupError } = useCollection<Order>(pendingOrdersGroupQuery)

  // 3. Fetch the specific UserProfile document when selected
  const activeProfileRef = useMemoFirebase(() => 
    (isAuthenticated && activeProfileId) ? doc(db, 'userProfiles', activeProfileId) : null,
    [db, isAuthenticated, activeProfileId]
  )
  const { data: activeProfile, isLoading: activeProfileLoading } = useDoc<UserProfile>(activeProfileRef)

  // 4. Fetch the Orders subcollection for the selected profile in real-time
  const ordersQuery = useMemoFirebase(() => 
    (isAuthenticated && activeProfileId) ? query(
      collection(db, 'userProfiles', activeProfileId, 'orders'),
      orderBy('createdAt', 'desc')
    ) : null, 
    [db, isAuthenticated, activeProfileId]
  )
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery)

  // Filter profiles based on search
  const filteredProfiles = profiles?.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCompleteOrder = async (order: Order) => {
    if (!activeProfileId || isProcessing) return
    setIsProcessing(true)

    try {
      // 1. Process each item for automatic stock deduction
      for (const item of order.items) {
        const productRef = doc(db, 'products', item.productId)
        
        // Use Firestore increment for atomic stock updates
        updateDocumentNonBlocking(productRef, {
          currentStockQuantity: increment(-item.quantity),
          updatedAt: serverTimestamp()
        })

        // 2. Log a STOCK_OUT_SALE audit record
        const transactionRef = doc(collection(db, 'stockTransactions'))
        setDocumentNonBlocking(transactionRef, {
          id: transactionRef.id,
          productId: item.productId,
          staffUserId: user?.uid || 'system',
          transactionType: 'STOCK_OUT_SALE',
          quantityChange: -item.quantity,
          transactionDate: serverTimestamp(),
          reason: `Auto-stockout: Order #${order.id.substring(0, 8)}`
        }, { merge: true })
      }

      // 3. Update Order Status to completed
      const orderRef = doc(db, 'userProfiles', activeProfileId, 'orders', order.id)
      updateDocumentNonBlocking(orderRef, {
        status: 'completed',
        processedAt: serverTimestamp(),
        processedBy: user?.uid
      })

      toast({
        title: "Order Processed",
        description: `Stock levels deducted and transaction logged.`,
      })
      setSelectedOrder(null)
    } catch (error) {
      console.error("Failed to process order stock:", error)
      toast({
        title: "Process Error",
        description: "An error occurred while updating inventory.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  const formatTimestamp = (ts: any) => {
    if (!ts) return "N/A"
    try {
      if (ts.toDate) return ts.toDate().toLocaleString()
      return new Date(ts).toLocaleString()
    } catch (e) {
      return "Processing..."
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Customer Orders <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Monitor and fulfill customer purchase requests.</p>
        </div>
      </div>

      {groupError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
          <strong>Database Sync Notice:</strong> Cross-customer order indicators require a Firestore index. 
          Please click the link in your console or error overlay to enable store-wide alerts.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Customer Directory</CardTitle>
            <CardDescription>Select a profile to manage their orders.</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {profilesLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></div>
                ) : filteredProfiles?.map((p) => {
                  const hasPending = pendingOrders?.some(order => order.userId === p.id || order.id?.includes(p.id));

                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProfileId(p.id)}
                      className={`relative w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group ${activeProfileId === p.id ? 'bg-primary/5 border-r-4 border-primary' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold truncate">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {hasPending && (
                          <div className="h-3 w-3 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        )}
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${activeProfileId === p.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </button>
                  )
                })}
                {!profilesLoading && filteredProfiles?.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No customers matched your search.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          {!activeProfileId ? (
            <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed">
              <User className="h-12 w-12 text-muted-foreground mb-4 opacity-10" />
              <CardTitle className="text-muted-foreground">Select a Customer</CardTitle>
              <CardDescription>Pick a profile from the directory to view orders.</CardDescription>
            </Card>
          ) : (
            <>
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary">
                    <User className="h-5 w-5" /> Customer Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeProfileLoading ? (
                    <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>
                  ) : activeProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Name</p>
                        <p className="font-bold">{activeProfile.firstName} {activeProfile.lastName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</p>
                        <p className="text-sm truncate">{activeProfile.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone</p>
                        <p className="text-sm">{activeProfile.phoneNumber || "None set"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive italic">Error loading profile details.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order) => (
                        <TableRow key={order.id} className="group animate-in fade-in duration-300">
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {order.id?.substring(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatTimestamp(order.createdAt)}
                          </TableCell>
                          <TableCell className="font-bold">
                            ₱{(order.total || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={order.status === 'completed' ? 'default' : 'secondary'} 
                              className="capitalize text-[10px]"
                            >
                              {order.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {ordersLoading && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 opacity-50">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      )}
                      {!ordersLoading && orders?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                            No orders found for this customer.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Order Summary</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date Placed
                  </p>
                  <p className="font-medium">{formatTimestamp(selectedOrder.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Method
                  </p>
                  <p className="font-medium">{selectedOrder.paymentMethod || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" /> Delivery Info
                </h4>
                <p className="text-sm bg-muted/30 p-4 rounded-xl border italic leading-relaxed">
                  {selectedOrder.address || "No delivery address provided."}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Purchased Items</h4>
                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-[10px]">Item</TableHead>
                        <TableHead className="text-[10px] text-center">Qty</TableHead>
                        <TableHead className="text-[10px] text-right">Unit</TableHead>
                        <TableHead className="text-[10px] text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs py-3">{item.name}</TableCell>
                          <TableCell className="text-xs text-center py-3">{item.quantity}</TableCell>
                          <TableCell className="text-xs text-right py-3">₱{(item.pricePerUnit || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right font-bold py-3 text-primary">
                            ₱{(item.quantity * (item.pricePerUnit || 0)).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-4 border-t-2 border-dashed">
                <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'outline'}>
                  {selectedOrder.status?.toUpperCase()}
                </Badge>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-black text-primary">₱{(selectedOrder.total || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            {selectedOrder?.status === 'pending' && (
              <Button 
                className="gap-2 bg-primary hover:bg-primary/90" 
                onClick={() => handleCompleteOrder(selectedOrder)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Complete & Deduct Stock
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
