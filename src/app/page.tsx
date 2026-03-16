"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingBag, Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, limit, doc } from 'firebase/firestore'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile } = useDoc(staffRef)

  const productsQuery = useMemoFirebase(() => query(collection(db, 'products')), [db])
  const transactionsQuery = useMemoFirebase(() => query(collection(db, 'stockTransactions'), orderBy('transactionDate', 'desc'), limit(5)), [db])

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery)
  const { data: transactions } = useCollection(transactionsQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const totalProducts = products?.length || 0
  const lowStockItems = products?.filter(p => p.currentStockQuantity <= p.lowStockThreshold && p.currentStockQuantity > 0).length || 0
  const outOfStockItems = products?.filter(p => p.currentStockQuantity <= 0).length || 0

  const chartData = products?.slice(0, 10).map(p => ({
    name: p.name,
    stock: p.currentStockQuantity,
    fill: p.currentStockQuantity <= p.lowStockThreshold ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
  })) || []

  const pieData = [
    { name: 'In Stock', value: totalProducts - lowStockItems - outOfStockItems },
    { name: 'Low Stock', value: lowStockItems },
    { name: 'Out of Stock', value: outOfStockItems },
  ].filter(d => d.value > 0)

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))']

  const totalValue = products?.reduce((acc, p) => acc + (p.currentStockQuantity * p.pricePerUnit), 0) || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{profile?.name ? `, ${profile.name}` : ''}! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Print Reports</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active in catalog</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-red-100 bg-red-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Action required</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">Unavailable items</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
          </CardContent>
        </Card>
      </div>

      {productsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Current Stock Levels</CardTitle>
                <CardDescription>Top products and their current quantities</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border p-2 rounded-lg shadow-sm text-xs">
                              <p className="font-bold">{payload[0].payload.name}</p>
                              <p className="text-primary">{payload[0].value} units</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Inventory Health</CardTitle>
                <CardDescription>Product status distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold">{totalProducts}</span>
                  <span className="text-xs text-muted-foreground text-center">Items<br/>Monitored</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest stock movements across all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions?.map((t) => {
                  const product = products?.find(p => p.id === t.productId)
                  return (
                    <div key={t.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          t.quantityChange > 0 ? 'bg-green-100 text-green-700' :
                          t.transactionType === 'STOCK_OUT_SALE' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t.quantityChange > 0 ? <ArrowUpRight className="h-4 w-4" /> :
                           t.transactionType === 'STOCK_OUT_SALE' ? <ArrowDownRight className="h-4 w-4" /> :
                           <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{product?.name || 'Unknown Product'}</p>
                          <p className="text-xs text-muted-foreground">
                            {mounted && t.transactionDate ? new Date(t.transactionDate.toDate()).toLocaleString() : "Processing..."}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          t.quantityChange > 0 ? 'text-green-600' :
                          t.transactionType === 'STOCK_OUT_SALE' ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {t.quantityChange > 0 ? '+' : ''}{t.quantityChange} {product?.unitOfMeasure}
                        </p>
                        <p className="text-xs text-muted-foreground">Audit ID: {t.id.substring(0, 6)}</p>
                      </div>
                    </div>
                  )
                })}
                {!transactions?.length && (
                  <p className="text-center text-sm text-muted-foreground py-4">No recent activity recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
