
"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Leaf, Apple, Carrot, Wheat, Flame } from "lucide-react"
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../lib/mock-data'

const ICON_MAP: Record<string, any> = {
  LeafyGreen: Leaf,
  Apple: Apple,
  Carrot: Carrot,
  Wheat: Wheat,
  Flame: Flame,
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Categories</h1>
          <p className="text-muted-foreground">Manage your product classifications.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CATEGORIES.map((category) => {
          const productCount = MOCK_PRODUCTS.filter(p => p.categoryId === category.id).length
          const Icon = ICON_MAP[category.icon] || Leaf

          return (
            <Card key={category.id} className="group hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-headline">{category.name}</CardTitle>
                  <CardDescription>{productCount} products listed</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end gap-2 pt-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
