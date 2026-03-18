
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Eye, MoreVertical, Loader2, MapPin, CreditCard, Calendar, User } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase'
import { collection, query, orderBy, limit, doc } from 'firebase/firestore'
import { Order, UserProfile } from '../types'
import { Separator } from '@/components/ui/separator'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous

  // 1. Fetch the UserProfile document first using the Auth UID
  const userProfileRef = useMemoFirebase(() => 
    isAuthenticated ? doc(db, 'userProfiles', user.uid) : null,
    [db, isAuthenticated, user?.uid]
  )
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef)

  // 2. Fetch the Orders subcollection under this specific UserProfile
  const ordersQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'userProfiles', user.uid, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(50)
    ) : null, 
    [db, isAuthenticated, user?.uid]
  )
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery)

  if (!mounted || isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <ShoppingBasket className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-headline font-bold">Please sign in</h2>
        <p className="text-muted-foreground">Log in to view your customer profile and order history.</p>
      </div>
    );
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
            Order Management <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Viewing data for customer ID: <span className="font-mono text-xs">{user.uid}</span></p>
        </div>
      </div>

      {/* Customer Profile Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="h-4 w-4" /> Customer Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</p>
                <p className="font-medium">{profile.firstName} {profile.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p>
                <p className="font-medium">{profile.phoneNumber || "Not provided"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No profile document found for this ID in /userProfiles.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Detailed list of purchases from your subcollection.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {order.id?.substring(0, 8) || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatTimestamp(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-bold">
                    ₱{(order.total || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                    {order.address}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3 opacity-50" />
                      {order.paymentMethod || "Cash"}
                    </div>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4" /> View Full Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {ordersLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 opacity-50">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
              {!ordersLoading && orders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                    No orders found in userProfiles/{user.uid}/orders.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              Order Details
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] break-all">
              Path: userProfiles/{user.uid}/orders/{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created At
                  </p>
                  <p className="font-medium">{formatTimestamp(selectedOrder.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Payment Method
                  </p>
                  <p className="font-medium">{selectedOrder.paymentMethod || "Not Specified"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" /> Delivery Address
                </h4>
                <p className="text-sm bg-muted/30 p-4 rounded-xl border border-border/50 leading-relaxed italic">
                  {selectedOrder.address || "No delivery address provided in record."}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Items</h4>
                <div className="border rounded-2xl overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-[10px] h-10">Product</TableHead>
                        <TableHead className="text-[10px] h-10 text-center">Qty</TableHead>
                        <TableHead className="text-[10px] h-10 text-right">Price</TableHead>
                        <TableHead className="text-[10px] h-10 text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-transparent">
                          <TableCell className="text-xs font-medium py-3">{item.name}</TableCell>
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

              <div className="flex justify-between items-center pt-6 mt-4 border-t-2 border-dashed border-muted">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Current Status</p>
                  <Badge className="mt-1" variant={selectedOrder.status === 'completed' ? 'default' : 'outline'}>
                    {selectedOrder.status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Grand Total</p>
                  <p className="text-3xl font-black text-primary">₱{(selectedOrder.total || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
