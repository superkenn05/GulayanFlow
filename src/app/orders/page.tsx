
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Eye, Loader2, User, Search, ChevronRight, MailCheck } from "lucide-react"
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
import emailjs from '@emailjs/browser'

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

  const isAuthenticated = mounted
  const profilesQuery = useMemoFirebase(() => mounted ? query(collection(db, 'userProfiles')) : null, [db, mounted])
  const { data: profiles, isLoading: profilesLoading } = useCollection<UserProfile>(profilesQuery)

  const pendingOrdersGroupQuery = useMemoFirebase(() => 
    mounted ? query(
      collectionGroup(db, 'orders'),
      where('status', '==', 'pending')
    ) : null, [db, mounted])
  const { data: pendingOrders } = useCollection<Order>(pendingOrdersGroupQuery)

  const activeProfileRef = useMemoFirebase(() => 
    (mounted && activeProfileId) ? doc(db, 'userProfiles', activeProfileId) : null,
    [db, mounted, activeProfileId]
  )
  const { data: activeProfile, isLoading: activeProfileLoading } = useDoc<UserProfile>(activeProfileRef)
  const ordersQuery = useMemoFirebase(() => 
    (mounted && activeProfileId) ? query(
      collection(db, 'userProfiles', activeProfileId, 'orders'),
      orderBy('createdAt', 'desc')
    ) : null, 
    [db, mounted, activeProfileId]
  )
  const { data: orders } = useCollection<Order>(ordersQuery)
  const filteredProfiles = profiles?.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const handleCompleteOrder = async (order: Order) => {
    if (!activeProfileId || isProcessing || !activeProfile) return
    setIsProcessing(true)

    try {
      // 1. Process each item for automatic stock deduction
      for (const item of order.items) {
        const productRef = doc(db, 'products', item.productId)
        
        updateDocumentNonBlocking(productRef, {
          currentStockQuantity: increment(-item.quantity),
          updatedAt: serverTimestamp()
        })

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

      // 2. Update Order Status
      const orderRef = doc(db, 'userProfiles', activeProfileId, 'orders', order.id)
      updateDocumentNonBlocking(orderRef, {
        status: 'completed',
        processedAt: serverTimestamp(),
        processedBy: user?.uid
      })

      // 3. Create In-App Notification for User
      const notificationRef = doc(collection(db, 'userProfiles', activeProfileId, 'notifications'))
      setDocumentNonBlocking(notificationRef, {
        id: notificationRef.id,
        title: "Order Completed! 🥳",
        message: `Hi ${activeProfile.firstName}, your order #${order.id.substring(0, 8).toUpperCase()} is now complete. Thank you for choosing Gemma's Gulayan!`,
        type: 'order_status',
        status: 'unread',
        createdAt: serverTimestamp(),
        orderId: order.id
      }, { merge: true })

      // 4. Send Email via EmailJS Client SDK
      const orderDateStr = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const itemsDescription = order.items.map(i => 
        `${i.quantity}x ${i.name} - ₱${(i.quantity * i.pricePerUnit).toLocaleString()}`
      ).join(', ');

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          customer_name: `${activeProfile.firstName} ${activeProfile.lastName}`,
          order_id: order.id.substring(0, 8).toUpperCase(),
          order_date: orderDateStr,
          total_amount: order.total.toLocaleString(),
          order_items: itemsDescription,
          to_email: activeProfile.email,
          title: `Order Completed: ${order.id.substring(0, 8).toUpperCase()}`,
          name: "Gemma's Gulayan Team 🌿",
          email: "support@gulayan.ph",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      toast({
        title: "Order Processed",
        description: `Status updated and Email notification sent to ${activeProfile.email}.`,
      })
      
      setSelectedOrder(null)
    } catch (error) {
      console.error("Failed to process order stock or send email:", error)
      toast({
        title: "Fulfillment Notice",
        description: "Order updated. Note: Email service might have encountered an issue.",
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
                    <p className="text-sm text-destructive italic">Error loading profile.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
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
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {order.id?.substring(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatTimestamp(order.createdAt)}
                          </TableCell>
                          <TableCell className="font-bold">
                            ₱{(order.total || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
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
          <DialogHeader><DialogTitle>Order Summary</DialogTitle></DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="uppercase font-bold text-muted-foreground">Date Placed</p>
                  <p className="font-medium">{formatTimestamp(selectedOrder.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="uppercase font-bold text-muted-foreground">Method</p>
                  <p className="font-medium">{selectedOrder.paymentMethod || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Delivery Address</h4>
                <p className="text-sm bg-muted/30 p-4 rounded-xl border italic">{selectedOrder.address}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Items</h4>
                <Table>
                  <TableBody>
                    {selectedOrder.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs py-2">{item.name}</TableCell>
                        <TableCell className="text-xs py-2">x{item.quantity}</TableCell>
                        <TableCell className="text-xs text-right py-2">₱{(item.quantity * item.pricePerUnit).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-dashed">
                <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'outline'}>{selectedOrder.status?.toUpperCase()}</Badge>
                <p className="text-2xl font-black text-primary">₱{(selectedOrder.total || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            {selectedOrder?.status === 'pending' && (
              <Button 
                className="gap-2" 
                onClick={() => handleCompleteOrder(selectedOrder)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                Complete & Notify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
