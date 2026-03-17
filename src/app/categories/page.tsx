"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Leaf, Apple, Carrot, Wheat, Flame, Loader2, Lock } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc } from 'firebase/firestore'
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { toast } from '@/hooks/use-toast'

const ICON_MAP: Record<string, any> = {
  LeafyGreen: Leaf,
  Apple: Apple,
  Carrot: Carrot,
  Wheat: Wheat,
  Flame: Flame,
}

export default function CategoriesPage() {
  const db = useFirestore()
  const { user } = useUser()

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)

  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const categoriesQuery = useMemoFirebase(() => isAdmin ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db, isAdmin])
  const productsQuery = useMemoFirebase(() => isAdmin ? query(collection(db, 'products')) : null, [db, isAdmin])
  
  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery)
  const { data: products } = useCollection(productsQuery)

  const handleDelete = (id: string, name: string) => {
    deleteDocumentNonBlocking(doc(db, 'categories', id))
    toast({ title: "Deleted", description: `${name} category removed.` })
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

      {categoriesLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => {
            const productCount = products?.filter(p => p.categoryId === category.id).length || 0
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => handleDelete(category.id, category.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
