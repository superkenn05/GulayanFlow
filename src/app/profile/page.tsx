"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, LogOut, Save, Loader2 } from "lucide-react"
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase'
import { doc } from 'firebase/firestore'
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { toast } from '@/hooks/use-toast'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  
  // Memoize document reference for the specific user
  const userRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading } = useDoc(userRef)

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  // Sync state when profile data arrives
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || ''
      })
    }
  }, [profile])

  const handleSaveChanges = async () => {
    if (!user || !userRef) return

    setIsSaving(true)
    try {
      updateDocumentNonBlocking(userRef, {
        name: formData.name,
        email: formData.email,
        updatedAt: new Date().toISOString()
      })
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved to the database."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update profile information.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed Out",
        description: "You have been logged out successfully."
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "There was a problem signing out.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold text-primary">My Profile</h1>
        <p className="text-muted-foreground">Manage your identity and staff information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-none shadow-md">
          <CardHeader className="flex flex-col items-center pb-0">
            <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-lg">
              <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/400`} />
              <AvatarFallback className="text-2xl font-bold bg-primary/5">
                {profile?.name?.substring(0, 2).toUpperCase() || 'ST'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl mt-4 text-center">{profile?.name || 'Staff Member'}</CardTitle>
            <Badge className="mt-2 bg-primary px-4 py-1">{profile?.role?.toUpperCase() || 'STAFF'}</Badge>
          </CardHeader>
          <CardContent className="space-y-6 mt-8">
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <span className="truncate flex-1">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span>{profile?.role === 'Admin' ? 'Admin Access' : 'Staff Access'}</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your personal details visible to other staff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10 h-11" 
                    placeholder="Full Name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-11" 
                    placeholder="email@gulayan.ph"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-bold mb-2">Password Management</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To change your authentication password, please use the password recovery tool on the login screen or consult an administrator for a reset.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end bg-muted/20 border-t rounded-b-lg">
            <Button 
              className="gap-2 h-11 px-8 shadow-lg shadow-primary/10" 
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save My Details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}