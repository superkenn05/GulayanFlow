
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ShoppingBag, 
  Loader2, 
  ShoppingBasket,
  Star,
  ChevronRight,
  Plus
} from "lucide-react"
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
import { collection, query, orderBy, limit, doc, where } from 'firebase/firestore'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { PlaceHolderImages } from '@/lib/placeholder-images'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Guard: Only run queries when auth is definitely ready and component is mounted
  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous

  const staffRef = useMemoFirebase(() => isAuthenticated ? doc(db, 'staffUsers', user.uid) : null, [db, user, isAuthenticated])
  const { data: profile } = useDoc(staffRef)

  const productsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collection(db, 'products')) : null, 
    [db, isAuthenticated]
  )
  
  const popularProductsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collection(db, 'products'), where('isPopular', '==', true), limit(10)) : null,
    [db, isAuthenticated]
  )
  
  // Recent activity filtered by the current user profile
  const transactionsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'stockTransactions'), 
      where('staffUserId', '==', user.uid),
      orderBy('transactionDate', 'desc'), 
      limit(10)
    ) : null, 
    [db, isAuthenticated, user?.uid]
  )
  
  const salesQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'stockTransactions'), 
      where('transactionType', '==', 'STOCK_OUT_SALE'),
      where('staffUserId', '==', user.uid)
    ) : null, 
    [db, isAuthenticated, user?.uid]
  )

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery)
  const { data: popularProducts, isLoading: popularLoading } = useCollection(popularProductsQuery)
  const { data: transactions, isLoading: transactionsLoading } = useCollection(transactionsQuery)
  const { data: sales } = useCollection(salesQuery)

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

  const isSuperadmin = user?.email === 'markken@gulayan.ph' || profile?.role === 'Superadmin'
  const isAdmin = profile?.role === 'Admin' || isSuperadmin

  const totalProducts = products?.length || 0
  const lowStockItems = products?.filter(p => (p.currentStockQuantity || 0) <= (p.lowStockThreshold || 10) && (p.currentStockQuantity || 0) > 0).length || 0
  const outOfStockItems = products?.filter(p => (p.currentStockQuantity || 0) <= 0).length || 0
  const totalOrders = sales?.length || 0

  const chartData = products?.slice(0, 10).map(p => ({
    name: p.name,
    stock: p.currentStockQuantity || 0,
    fill: (p.currentStockQuantity || 0) <= (p.lowStockThreshold || 10) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
  })) || []

  const pieData = [
    { name: 'In Stock', value: Math.max(0, totalProducts - lowStockItems - outOfStockItems) },
    { name: 'Low Stock', value: lowStockItems },
    { name: 'Out of Stock', value: outOfStockItems },
  ].filter(d => d.value > 0)

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))']
  const totalValue = products?.reduce((acc, p) => acc + ((p.currentStockQuantity || 0) * (p.pricePerUnit || 0)), 0) || 0

  const bannerImage = PlaceHolderImages?.find(img => img.id === 'store_banner')?.imageUrl || 'https://picsum.photos/seed/gulayan/1200/400'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header with Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{profile?.name ? `, ${profile.name}` : ''}! Here's your store overview.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline">Print Reports</Button>
          </div>
        )}
      </div>

      {/* Hero Banner Section */}
      <div className="relative w-full h-[220px] md:h-[320px] rounded-3xl overflow-hidden shadow-2xl group border-4 border-background">
        <img 
          src={bannerImage} 
          alt="Gemma's Gulayan" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          data-ai-hint="vegetable market"
        />
      </div>

      {/* Stats Cards */}
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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Sales</CardTitle>
            <ShoppingBasket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Recorded by you</p>
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
        
        {isAdmin ? (
          <Card className="hover:shadow-md transition-shadow bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Store-wide estimate</p>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>

      {/* Popular Now Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-headline font-bold text-foreground">Popular Now</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Most loved by locals</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-bold group">
            SEE ALL <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {popularLoading ? (
          <div className="flex gap-4 overflow-hidden py-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="min-w-[200px] h-[250px] bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : popularProducts && popularProducts.length > 0 ? (
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-4 p-4">
              {popularProducts.map((p) => (
                <Card key={p.id} className="min-w-[220px] max-w-[220px] overflow-hidden border-none shadow-lg ring-1 ring-border group rounded-2xl transition-all hover:scale-[1.02]">
                  <div className="relative h-32 w-full overflow-hidden">
                    <img src={p.imageUrl || 'https://picsum.photos/seed/popular/400/300'} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-400 text-yellow-950 border-none font-black text-[9px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <Star className="h-2 w-2 fill-yellow-950" /> POPULAR
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-1">
                    <h3 className="font-bold text-sm truncate">{p.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">PER {p.unitOfMeasure}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-black text-primary">₱{p.pricePerUnit}</span>
                      <Button size="icon" className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <Card className="border-dashed py-12 flex flex-col items-center justify-center bg-muted/20 text-center">
            <Star className="h-12 w-12 text-muted-foreground opacity-10 mb-2" />
            <h3 className="font-bold">No popular items found</h3>
            <p className="text-xs text-muted-foreground">Mark items as popular in the inventory catalog to show them here.</p>
          </Card>
        )}
      </div>

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
                    return null;
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
          <CardTitle>Your Recent Activity</CardTitle>
          <CardDescription>Latest stock movements logged by your account</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>
          ) : (
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
                        {t.quantityChange > 0 ? '+' : ''}{t.quantityChange} {product?.unitOfMeasure || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">Audit ID: {t.id.substring(0, 6)}</p>
                    </div>
                  </div>
                )
              })}
              {!transactions?.length && (
                <p className="text-center text-sm text-muted-foreground py-4">No recent activity recorded by you.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
