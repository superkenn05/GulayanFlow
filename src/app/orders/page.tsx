"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Plus, Eye, MoreVertical, Loader2, Lock } from "lucide-react"
import { MOCK_ORDERS } from '../lib/mock-data'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Orders <ShoppingBasket className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Track sales and customer transactions.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>A list of all customer transactions registered in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ORDERS.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {mounted ? new Date(order.date).toLocaleString() : ""}
                  </TableCell>
                  <TableCell className="font-bold text-primary">₱{order.total}</TableCell>
                  <TableCell>
                    <Badge variant={
                      order.status === 'completed' ? 'default' : 
                      order.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {order.status.toUpperCase()}
                    </Badge>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
