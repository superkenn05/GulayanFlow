
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Plus, Eye, MoreVertical, Loader2 } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Guard: Only run queries when auth is definitely ready and we are client-side
  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous

  // Fetch orders from the specific path shown in the database: /userProfiles/{userId}/orders
  const ordersQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'userProfiles', user.uid, 'orders'),
      orderBy('orderDate', 'desc'),
      limit(50)
    ) : null, 
    [db, isAuthenticated, user?.uid]
  )
  
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery)

  if (!mounted || isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!user || user.isAnonymous) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Order History <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Detailed history of orders from your user profile.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>All your historical orders retrieved from userProfiles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => {
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {mounted && order.orderDate ? new Date(order.orderDate).toLocaleString() : "Processing..."}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items?.length || 0} items
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      ₱{(order.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
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
                          <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-primary font-bold">Print Receipt</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {ordersLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 opacity-50">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
              {!ordersLoading && orders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No orders found for this account.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
