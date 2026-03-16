"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Trash2, Filter, Loader2, History } from 'lucide-react'
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, limit, doc } from 'firebase/firestore'

export default function StockTrackingPage() {
  const [activeTab, setActiveTab] = useState('history')
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile } = useDoc(staffRef)

  // Only query if staff access is confirmed
  const hasAccess = !!profile?.role;

  const productsQuery = useMemoFirebase(() => hasAccess ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, hasAccess])
  const transactionsQuery = useMemoFirebase(() => hasAccess ? query(collection(db, 'stockTransactions'), orderBy('transactionDate', 'desc'), limit(50)) : null, [db, hasAccess])
  const staffQuery = useMemoFirebase(() => hasAccess ? query(collection(db, 'staffUsers')) : null, [db, hasAccess])

  const { data: products } = useCollection(productsQuery)
  const { data: transactions, isLoading: transactionsLoading } = useCollection(transactionsQuery)
  const { data: staffMembers } = useCollection(staffQuery)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          Stock Tracking <History className="h-6 w-6" />
        </h1>
        <p className="text-muted-foreground">Log inventory movements and track history.</p>
      </div>

      {!hasAccess ? (
        <Card className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Accessing history...</p>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="history">Transaction History</TabsTrigger>
            <TabsTrigger value="entry">Log Movement</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm ring-1 ring-border">
               <div className="flex gap-4">
                  <Input placeholder="Filter by product..." className="max-w-xs" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Movements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Movements</SelectItem>
                      <SelectItem value="STOCK_IN">Stock Entry (In)</SelectItem>
                      <SelectItem value="STOCK_OUT_SALE">Sales (Out)</SelectItem>
                      <SelectItem value="STOCK_OUT_WASTE">Waste</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <Button variant="ghost" className="gap-2">
                 <Filter className="h-4 w-4" /> More Filters
               </Button>
            </div>

            <Card>
              {transactionsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Reason/Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((t) => {
                      const product = products?.find(p => p.id === t.productId)
                      const staffMember = staffMembers?.find(s => s.id === t.staffUserId)
                      const isPositive = t.quantityChange > 0

                      return (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">
                            {t.transactionDate ? new Date(t.transactionDate.toDate()).toLocaleString() : "Processing..."}
                          </TableCell>
                          <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${
                              isPositive ? 'border-green-500 text-green-600 bg-green-50' :
                              t.transactionType === 'STOCK_OUT_SALE' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                              'border-red-500 text-red-600 bg-red-50'
                            } flex items-center w-fit gap-1`}>
                              {isPositive ? <ArrowUpRight className="h-3 w-3" /> :
                               t.transactionType === 'STOCK_OUT_SALE' ? <ArrowDownRight className="h-3 w-3" /> :
                               <Trash2 className="h-3 w-3" />}
                              {t.transactionType?.replace('STOCK_', '').replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">
                            {isPositive ? '+' : ''}{t.quantityChange} {product?.unitOfMeasure}
                          </TableCell>
                          <TableCell>{staffMember?.name || 'System'}</TableCell>
                          <TableCell className="text-muted-foreground text-xs italic">{t.reason || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                    {!transactions?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No transactions recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="entry">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Log Stock Entry/Waste</CardTitle>
                  <CardDescription>Record a new transaction manually.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Movement Type</Label>
                    <Select defaultValue="STOCK_IN">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK_IN">Stock Entry (In)</SelectItem>
                        <SelectItem value="STOCK_OUT_TRANSFER">Stock Transfer (Out)</SelectItem>
                        <SelectItem value="STOCK_OUT_WASTE">Damage/Waste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" placeholder="Enter amount" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason/Notes (Optional)</Label>
                    <Textarea placeholder="Add a reason for this movement..." />
                  </div>
                  <Button className="w-full">Submit Transaction</Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-primary text-primary-foreground">
                  <CardHeader>
                    <CardTitle>Tips for Staff</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 opacity-90">
                    <p>• Always double-check weights before logging.</p>
                    <p>• Provide clear reasons for waste (e.g., "bruised", "expired").</p>
                    <p>• Log "Stock In" immediately after delivery to keep alerts accurate.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Current Stock Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {products?.slice(0, 5).map(p => (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span>{p.name}</span>
                        <span className="font-bold">{p.currentStockQuantity} {p.unitOfMeasure}</span>
                      </div>
                    ))}
                    <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setActiveTab('history')}>View all history</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}