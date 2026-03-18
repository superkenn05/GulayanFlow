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
import { collection, query, where, orderBy, limit } from 'firebase/firestore'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Explicit check: Wait for user to be ready before defining queries
  const isAuthenticated = !!user && !user.isAnonymous

  const salesQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'stockTransactions'), 
      where('transactionType', '==', 'STOCK_OUT_SALE'),
      orderBy('transactionDate', 'desc'),
      limit(50)
    ) : null, 
    [db, user, isAuthenticated]
  )
  const productsQuery = useMemoFirebase(() => isAuthenticated ? query(collection(db, 'products')) : null, [db, isAuthenticated])

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery)
  const { data: products } = useCollection(productsQuery)

  if (!mounted || isUserLoading || !isAuthenticated) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Orders <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Track sales and customer transactions recorded in the system.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales History</CardTitle>
          <CardDescription>A live list of all sales recorded via stock movements.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total (Est.)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((sale) => {
                const product = products?.find(p => p.id === sale.productId)
                const total = Math.abs(sale.quantityChange) * (sale.unitCostAtTransaction || product?.pricePerUnit || 0)
                
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.id.substring(0, 8)}</TableCell>
                    <TableCell className="font-medium">{product?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {mounted && sale.transactionDate ? new Date(sale.transactionDate.toDate()).toLocaleString() : ""}
                    </TableCell>
                    <TableCell className="font-bold">
                      {Math.abs(sale.quantityChange)} {product?.unitOfMeasure || 'unit'}
                    </TableCell>
                    <TableCell className="font-bold text-primary">₱{total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default">COMPLETED</Badge>
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
              {salesLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 opacity-50">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
              {!salesLoading && sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                    No sales recorded yet. Try adding a "Stock Out (Sale)" from the Stock Tracking page.
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