
"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, Plus, Eye, MoreVertical } from "lucide-react"
import { MOCK_ORDERS } from '../lib/mock-data'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
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
                    {new Date(order.date).toLocaleString()}
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
