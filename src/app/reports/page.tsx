"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar as CalendarIcon, Filter, Loader2, Lock } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'

const salesData = [
  { day: 'Mon', amount: 4500 },
  { day: 'Tue', amount: 5200 },
  { day: 'Wed', amount: 4800 },
  { day: 'Thu', amount: 6100 },
  { day: 'Fri', amount: 5900 },
  { day: 'Sat', amount: 8500 },
  { day: 'Sun', amount: 7200 },
]

export default function ReportsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

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
            Reports <FileText className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Detailed analysis of your store's performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" /> Last 7 Days
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Sales figures for the current week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Trend</CardTitle>
            <CardDescription>Comparison with previous period performance.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
          <CardDescription>Key metrics for your stock management.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Stock Value</p>
              <p className="text-3xl font-bold">₱42,850.00</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Stock Turn-over Rate</p>
              <p className="text-3xl font-bold">4.2x</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Waste Percentage</p>
              <p className="text-3xl font-bold text-destructive">2.4%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
