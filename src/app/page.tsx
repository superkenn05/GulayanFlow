
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ShoppingBag, 
  Loader2, 
  ShoppingBasket,
  ArrowRight
} from "lucide-react";
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
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, where } from 'firebase/firestore';
import Image from 'next/image';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: Only run queries when auth is definitely ready and component is mounted
  const isAuthenticated = mounted && !isUserLoading && !!user && !user.isAnonymous;

  const staffRef = useMemoFirebase(() => isAuthenticated ? doc(db, 'staffUsers', user.uid) : null, [db, user, isAuthenticated]);
  const { data: profile } = useDoc(staffRef);

  // Guard the config fetch until authenticated to prevent permission errors
  const configRef = useMemoFirebase(() => isAuthenticated ? doc(db, 'storeConfigs', 'settings') : null, [db, isAuthenticated]);
  const { data: config } = useDoc(configRef);

  const productsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(collection(db, 'products')) : null, 
    [db, isAuthenticated]
  );
  
  const transactionsQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'stockTransactions'), 
      where('staffUserId', '==', user.uid),
      orderBy('transactionDate', 'desc'), 
      limit(10)
    ) : null, 
    [db, isAuthenticated, user?.uid]
  );
  
  const salesQuery = useMemoFirebase(() => 
    isAuthenticated ? query(
      collection(db, 'stockTransactions'), 
      where('transactionType', '==', 'STOCK_OUT_SALE'),
      where('staffUserId', '==', user.uid)
    ) : null, 
    [db, isAuthenticated, user?.uid]
  );

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection(transactionsQuery);
  const { data: sales } = useCollection(salesQuery);

  if (!mounted || isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return null;
  }

  const isSuperadmin = user?.email === 'markken@gulayan.ph' || profile?.role === 'Superadmin';
  const isAdmin = profile?.role === 'Admin' || isSuperadmin;

  const totalProducts = products?.length || 0;
  const lowStockItems = products?.filter(p => (p.currentStockQuantity || 0) <= (p.lowStockThreshold || 10) && (p.currentStockQuantity || 0) > 0).length || 0;
  const outOfStockItems = products?.filter(p => (p.currentStockQuantity || 0) <= 0).length || 0;
  const totalOrders = sales?.length || 0;

  const chartData = products?.slice(0, 10).map(p => ({
    name: p.name,
    stock: p.currentStockQuantity || 0,
    fill: (p.currentStockQuantity || 0) <= (p.lowStockThreshold || 10) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
  })) || [];

  const pieData = [
    { name: 'In Stock', value: Math.max(0, totalProducts - lowStockItems - outOfStockItems) },
    { name: 'Low Stock', value: lowStockItems },
    { name: 'Out of Stock', value: outOfStockItems },
  ].filter(d => d.value > 0);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];
  const totalValue = products?.reduce((acc, p) => acc + ((p.currentStockQuantity || 0) * (p.pricePerUnit || 0)), 0) || 0;

  // Use the banner from settings or a default
  const bannerImage = config?.bannerUrl || 'https://picsum.photos/seed/gulayan/1200/400';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Banner Section */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-border">
        <Image 
          src={bannerImage} 
          alt="Store Banner" 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Gemma&apos;s Gulayan
          </h2>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-lg mt-2 drop-shadow-sm">
            Fresh harvest management & real-time inventory control.
          </p>
        </div>
      </div>

      {/* Header with Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Overview</h1>
          <p className="text-muted-foreground">Welcome back{profile?.name ? `, ${profile.name}` : ''}! Tracking your store&apos;s performance.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline">Print Reports</Button>
          </div>
        )}
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
                      );
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
                const product = products?.find(p => p.id === t.productId);
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
                );
              })}
              {!transactions?.length && (
                <p className="text-center text-sm text-muted-foreground py-4">No recent activity recorded by you.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
