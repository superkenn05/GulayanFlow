
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

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  
  // Memoize the document reference to the user's specific staff profile
  const userRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading } = useDoc(userRef)

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  // Sync form state when profile data is loaded from Firestore
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
        description: "Your account details have been saved successfully."
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error saving your changes.",
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
        title: "Logged Out",
        description: "You have been signed out of GulayanFlow."
      })
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Could not log out at this time.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <p className="text-muted-foreground">Staff profile not found. Please ensure you are logged in correctly.</p>
        <Button onClick={handleLogout} variant="link" className="mt-4">Back to Login</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Staff Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
              <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
              <AvatarFallback>{profile?.name?.substring(0, 2).toUpperCase() || 'ST'}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl text-center">{profile?.name}</CardTitle>
            <Badge className="mt-2 bg-primary">{profile?.role?.toUpperCase() || 'STAFF'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span>{profile?.role === 'Admin' ? 'Full System Access' : 'Standard Staff Access'}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Log Out
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Update your credentials and display name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10" 
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10" 
                    placeholder="name@gulayan.ph"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Security Settings</h3>
              <p className="text-sm text-muted-foreground">
                To update your login password, please use the account recovery options or contact a system administrator.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end bg-muted/30 border-t">
            <Button 
              className="gap-2" 
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
