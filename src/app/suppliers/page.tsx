
"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, Plus, Phone, Mail, MapPin } from "lucide-react"
import { MOCK_SUPPLIERS } from '../lib/mock-data'
import { Badge } from "@/components/ui/badge"

export default function SuppliersPage() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Suppliers <Truck className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Manage your network of farmers and wholesalers.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SUPPLIERS.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{supplier.name}</CardTitle>
                <Badge variant={supplier.status === 'active' ? 'default' : 'outline'}>
                  {supplier.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>{supplier.category} Specialist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span>{supplier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {supplier.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {supplier.email}
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Contact</Button>
              <Button variant="outline" size="sm" className="flex-1">Order History</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { User } from 'lucide-react'
