
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ArrowUpRight, ArrowDownRight, Trash2, Filter, Loader2, History, MoreVertical, ShieldAlert } from 'lucide-react'
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, limit, doc, serverTimestamp } from 'firebase/firestore'
import { deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { toast } from '@/hooks/use-toast'

export default function StockTrackingPage() {
  const [activeTab, setActiveTab] = useState('history')
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const productsQuery = useMemoFirebase(() => query(collection(db, 'products'), orderBy('name', 'asc')), [db])
  const transactionsQuery = useMemoFirebase(() => query(collection(db, 'stockTransactions'), orderBy('transactionDate', 'desc'), limit(50)), [db])
  
  // Guard: Only fetch the staff directory if the user is an Admin/Superadmin to avoid permission errors
  const staffQuery = useMemoFirebase(() => isAdmin ? query(collection(db, 'staffUsers')) : null, [db, isAdmin])

  const { data: products } = useCollection(productsQuery)
  const { data: transactions, isLoading: transactionsLoading } = useCollection(transactionsQuery)
  const { data: staffMembers } = useCollection(staffQuery)

  const [form, setForm] = useState({
    productId: '',
    type: 'STOCK_IN',
    quantity: '',
    reason: ''
  })

  const handleSubmitTransaction = async () => {
    if (!form.productId || !form.quantity) {
      toast({ title: "Missing fields", variant: "destructive" })
      return
    }

    const selectedProduct = products?.find(p => p.id === form.productId)
    if (!selectedProduct) return

    const quantityChange = form.type === 'STOCK_IN' ? parseFloat(form.quantity) : -parseFloat(form.quantity)
    const transactionRef = doc(collection(db, 'stockTransactions'))
    
    setDocumentNonBlocking(transactionRef, {
      id: transactionRef.id,
      productId: form.productId,
      staffUserId: user?.uid || 'system',
      transactionType: form.type,
      quantityChange,
      transactionDate: serverTimestamp(),
      unitCostAtTransaction: selectedProduct.pricePerUnit,
      reason: form.reason
    }, { merge: true })

    updateDocumentNonBlocking(doc(db, 'products', form.productId), {
      currentStockQuantity: (selectedProduct.currentStockQuantity || 0) + quantityChange,
      updatedAt: serverTimestamp()
    })

    toast({ title: "Transaction Logged" })
    setForm({ productId: '', type: 'STOCK_IN', quantity: '', reason: '' })
    setActiveTab('history')
  }

  const handleDeleteTransaction = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'stockTransactions', id))
    toast({ title: "Record Deleted" })
  }

  if (isProfileLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Stock Tracking <History className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Log inventory movements and track history.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="entry">Log Movement</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
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
                    {isAdmin && <TableHead className="text-right">Admin</TableHead>}
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
                          } flex items-center w-fit gap-1 text-[10px] uppercase font-bold`}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> :
                              t.transactionType === 'STOCK_OUT_SALE' ? <ArrowDownRight className="h-3 w-3" /> :
                              <Trash2 className="h-3 w-3" />}
                            {t.transactionType?.replace('STOCK_', '').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {isPositive ? '+' : ''}{t.quantityChange} {product?.unitOfMeasure || 'units'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {staffMember?.name || (t.staffUserId === user?.uid ? profile?.name : 'Authorized Staff')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs italic">{t.reason || '-'}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTransaction(t.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                  {!transactionsLoading && transactions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-muted-foreground">
                        No transactions found.
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
                  <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK_IN">Stock Entry (In)</SelectItem>
                      <SelectItem value="STOCK_OUT_TRANSFER">Stock Transfer (Out)</SelectItem>
                      <SelectItem value="STOCK_OUT_WASTE">Damage/Waste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={form.productId} onValueChange={v => setForm(p => ({...p, productId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" placeholder="Enter amount" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Reason/Notes (Optional)</Label>
                  <Textarea placeholder="Add a reason for this movement..." value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))} />
                </div>
                <Button className="w-full h-11" onClick={handleSubmitTransaction}>Submit Transaction</Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" /> Operational Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4 text-muted-foreground">
                  <p>• Staff can log entries, sales, and waste movements.</p>
                  <p>• Accuracy in weights and quantities is critical for audit integrity.</p>
                  <p>• Only Administrators can modify or delete historical records.</p>
                  <p>• Use the "Reason" field for waste to help identify recurring issues.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
