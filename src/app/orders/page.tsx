
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Eye, MoreVertical, Loader2, MapPin, CreditCard, User, Mail, Phone, Calendar, Info } from "lucide-react"
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

  // Fetch the User Profile explicitly from the userProfiles collection
  const profileRef = useMemoFirebase(() => 
    isAuthenticated ? doc(db, 'userProfiles', user.uid) : null, 
    [db, isAuthenticated, user?.uid]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef)

  // Fetch the Orders subcollection under the specific UserProfile
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
            My Orders <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Manage your delivery addresses and historical purchases.</p>
        </div>
      </div>

      {/* Profile Detail Card */}
      <Card className="bg-primary/5 border-primary/10 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Customer Profile
          </CardTitle>
          <CardDescription>This information is retrieved from your UserProfile document.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Full Name</p>
              <p className="text-base font-bold">
                {isProfileLoading ? "Loading..." : profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.displayName : user.displayName || 'Guest User'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contact Email</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {profile?.email || user.email}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone Number</p>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {profile?.phoneNumber || "Not provided"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isProfileLoading && !profile && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold">No User Profile Document Found</p>
              <p className="opacity-80">You are logged in as <b>{user.email}</b>, but a document doesn't exist in the <code>userProfiles</code> collection yet. Orders shown below are from your specific subcollection path.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Showing recent orders from your profile subcollection.</CardDescription>
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
                    No orders found in your customer profile.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              Order Details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Path: userProfiles/{user.uid}/orders/{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Timestamp
                  </p>
                  <p className="text-sm font-medium">{formatTimestamp(selectedOrder.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Method
                  </p>
                  <p className="text-sm font-medium">{selectedOrder.paymentMethod || "Not Specified"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" /> Delivery Address
                </h4>
                <p className="text-sm bg-muted/30 p-4 rounded-xl border border-border/50 leading-relaxed italic">
                  {selectedOrder.address || "No delivery address provided in record."}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Purchased Items</h4>
                <div className="border rounded-2xl overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-[10px] h-10">Product</TableHead>
                        <TableHead className="text-[10px] h-10 text-center">Qty</TableHead>
                        <TableHead className="text-[10px] h-10 text-right">Price/Unit</TableHead>
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
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                  <Badge className="mt-1" variant={selectedOrder.status === 'completed' ? 'default' : 'outline'}>
                    {selectedOrder.status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Order Total</p>
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
