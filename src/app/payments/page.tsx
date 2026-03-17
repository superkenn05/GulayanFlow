
"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus, ArrowUpCircle, ArrowDownCircle, Filter, Download } from "lucide-react"
import { MOCK_PAYMENTS } from '../lib/mock-data'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState(MOCK_PAYMENTS)
  const [mounted, setMounted] = useState(false)
  
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile } = useDoc(staffRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const totalIncome = payments
    .filter(p => p.type === 'income' && p.status === 'successful')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalExpenses = payments
    .filter(p => p.type === 'expense' && p.status === 'successful')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Payment Management <CreditCard className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Track sales income and supplier payments.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          )}
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-50/30 border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Income</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">₱{totalIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Successful customer payments</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50/30 border-red-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">₱{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Payments to suppliers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{(totalIncome - totalExpenses).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current month performance</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A complete log of incoming and outgoing payments.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm text-nowrap">
                    {mounted ? new Date(payment.date).toLocaleDateString() : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.description}</span>
                      <span className="text-xs text-muted-foreground font-mono">{payment.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.type === 'income' ? 'secondary' : 'outline'} className="capitalize">
                      {payment.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{payment.method}</TableCell>
                  <TableCell className={`font-bold ${payment.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {payment.type === 'income' ? '+' : '-'}₱{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      payment.status === 'successful' ? 'default' : 
                      payment.status === 'pending' ? 'secondary' : 'destructive'
                    } className="capitalize">
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Filter className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Download Receipt</DropdownMenuItem>
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
