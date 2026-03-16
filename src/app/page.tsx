
"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingBag } from "lucide-react"
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './lib/mock-data'
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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const totalProducts = MOCK_PRODUCTS.length
  const lowStockItems = MOCK_PRODUCTS.filter(p => p.status === 'low-stock').length
  const outOfStockItems = MOCK_PRODUCTS.filter(p => p.status === 'out-of-stock').length

  const chartData = MOCK_PRODUCTS.map(p => ({
    name: p.name,
    stock: p.currentStock,
    fill: p.status === 'low-stock' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
  }))

  const pieData = [
    { name: 'In Stock', value: MOCK_PRODUCTS.filter(p => p.status === 'in-stock').length },
    { name: 'Low Stock', value: lowStockItems },
    { name: 'Out of Stock', value: outOfStockItems },
  ]

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))']

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Gemma! Here's what's happening today.</p>
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
            <p className="text-xs text-muted-foreground">+2 since yesterday</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-red-100 bg-red-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Action required immediately</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱12,450</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Current Stock Levels</CardTitle>
            <CardDescription>Quantities by product name</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
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
          <CardContent className="h-[300px] flex items-center justify-center">
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
            {MOCK_TRANSACTIONS.map((t) => {
              const product = MOCK_PRODUCTS.find(p => p.id === t.productId)
              return (
                <div key={t.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      t.type === 'in' ? 'bg-green-100 text-green-700' :
                      t.type === 'out' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t.type === 'in' ? <ArrowUpRight className="h-4 w-4" /> :
                       t.type === 'out' ? <ArrowDownRight className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{product?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-muted-foreground">
                        {mounted ? new Date(t.date).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      t.type === 'in' ? 'text-green-600' :
                      t.type === 'out' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {t.type === 'in' ? '+' : '-'}{t.quantity} {product?.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">by {t.staffName}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
