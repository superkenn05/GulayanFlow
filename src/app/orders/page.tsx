
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Eye, MoreVertical, Loader2, MapPin, CreditCard } from "lucide-react"
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
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import { Order } from '../types'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous

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
        <p className="text-muted-foreground">Authorized staff can view order history here.</p>
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
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Order History <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Retrieving detailed records from user profile subcollections.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Profile Orders</CardTitle>
          <CardDescription>All historical orders retrieved from your specific user profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {order.id || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatTimestamp(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-bold">
                    ₱{(order.total || 0).toLocaleString()}
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
                          <Eye className="h-4 w-4" /> Full Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {ordersLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 opacity-50">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading your orders...
                  </TableCell>
                </TableRow>
              )}
              {!ordersLoading && orders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No orders found in your profile.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              Placed on {formatTimestamp(selectedOrder?.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Delivery Address
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border">
                  {selectedOrder.address || "No address provided."}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold">Items Ordered</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[10px]">Item</TableHead>
                        <TableHead className="text-[10px] text-center">Qty</TableHead>
                        <TableHead className="text-[10px] text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{item.name}</TableCell>
                          <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                          <TableCell className="text-xs text-right">₱{(item.pricePerUnit || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium">{selectedOrder.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold text-primary">₱{(selectedOrder.total || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
