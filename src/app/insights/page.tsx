"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Sparkles, Loader2, ArrowRightCircle, CheckCircle2, Lock } from "lucide-react"
import { aiInventoryInsights, AIInventoryInsightsOutput } from '@/ai/flows/ai-inventory-insights'
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from '../lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AIInventoryInsightsOutput | null>(null)
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const generateInsights = async () => {
    setLoading(true)
    try {
      const currentInventory = MOCK_PRODUCTS.map(p => ({
        productId: p.id,
        name: p.name,
        category: 'Produce',
        currentStock: p.currentStock,
        price: p.price
      }))

      const transactionHistory = MOCK_TRANSACTIONS.map(t => ({
        productId: t.productId,
        quantitySold: t.type === 'out' ? t.quantity : 0,
        date: t.date
      }))

      const result = await aiInventoryInsights({
        currentInventory,
        transactionHistory
      })
      setInsights(result)
    } catch (error) {
      console.error("Failed to fetch insights:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isProfileLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div>
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive"><Lock className="h-8 w-8" /></div>
        <h2 className="text-2xl font-headline font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">This section is restricted to administrators.</p>
        <Button asChild variant="outline"><a href="/">Dashboard</a></Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            AI Inventory Insights <Sparkles className="h-6 w-6 text-accent" />
          </h1>
          <p className="text-muted-foreground">Get smart suggestions for your stock management based on sales history.</p>
        </div>
        <Button onClick={generateInsights} disabled={loading} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
          {loading ? "Analyzing Data..." : "Generate AI Insights"}
        </Button>
      </div>

      {!insights && !loading && (
        <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center bg-muted/20">
          <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-xl font-headline font-semibold">Ready to analyze your store?</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Our AI agent will review your current stock levels and sales history to identify trends and provide restocking suggestions.</p>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 pointer-events-none grayscale">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {insights && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Market Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{insights.marketInsights}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Best-Selling Products</CardTitle>
                <CardDescription>Top performers based on recent volume.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.bestSellingProducts.map((p) => (
                    <div key={p.productId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {p.name.charAt(0)}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <Badge className="bg-accent text-accent-foreground">{p.salesVolume} sold</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimal Stock Suggestions</CardTitle>
                <CardDescription>AI-recommended levels for your inventory.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.optimalStockSuggestions.map((s) => (
                    <div key={s.productId} className="flex flex-col gap-1 border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{s.name}</span>
                        <div className="flex items-center gap-1 text-primary">
                            <ArrowRightCircle className="h-4 w-4" />
                            <span className="font-bold">{s.suggestedOptimalStock} units</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{s.reasoning}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
