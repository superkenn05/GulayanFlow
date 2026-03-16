
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from '../lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Trash2, Filter } from 'lucide-react'

export default function StockTrackingPage() {
  const [activeTab, setActiveTab] = useState('history')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Stock Tracking</h1>
        <p className="text-muted-foreground">Log inventory movements and track history.</p>
      </div>

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
                    <SelectItem value="in">Stock Entry (In)</SelectItem>
                    <SelectItem value="out">Sales (Out)</SelectItem>
                    <SelectItem value="waste">Waste</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <Button variant="ghost" className="gap-2">
               <Filter className="h-4 w-4" /> More Filters
             </Button>
          </div>

          <Card>
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
                {MOCK_TRANSACTIONS.map((t) => {
                  const product = MOCK_PRODUCTS.find(p => p.id === t.productId)
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">
                        {mounted ? new Date(t.date).toLocaleString() : ""}
                      </TableCell>
                      <TableCell className="font-medium">{product?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${
                          t.type === 'in' ? 'border-green-500 text-green-600 bg-green-50' :
                          t.type === 'out' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                          'border-red-500 text-red-600 bg-red-50'
                        } flex items-center w-fit gap-1`}>
                          {t.type === 'in' ? <ArrowUpRight className="h-3 w-3" /> :
                           t.type === 'out' ? <ArrowDownRight className="h-3 w-3" /> :
                           <Trash2 className="h-3 w-3" />}
                          {t.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {t.type === 'in' ? '+' : '-'}{t.quantity} {product?.unit}
                      </TableCell>
                      <TableCell>{t.staffName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs italic">{t.reason || '-'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
                  <Select defaultValue="in">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock Entry (In)</SelectItem>
                      <SelectItem value="out">Stock Transfer (Out)</SelectItem>
                      <SelectItem value="waste">Damage/Waste</SelectItem>
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
                      {MOCK_PRODUCTS.map(p => (
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
                  {MOCK_PRODUCTS.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span>{p.name}</span>
                      <span className="font-bold">{p.currentStock} {p.unit}</span>
                    </div>
                  ))}
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setActiveTab('history')}>View all inventory</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
