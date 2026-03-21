
"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Leaf, Loader2, Lock, Mail, AlertCircle } from "lucide-react"
import { useAuth, useFirestore, useUser } from '@/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth'
import { 
  doc, 
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    if (user && !user.isAnonymous) {
      router.push('/')
    }
  }, [user, router])

  const handleActivation = async (email: string, pass: string) => {
    // 1. Superadmin Special Activation
    if (email === 'markken@gulayan.ph' && pass === 'admin123456789') {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass)
        await updateProfile(userCredential.user, { displayName: 'Mark Ken (Superadmin)' })
        
        const batch = writeBatch(db)
        const newUserRef = doc(db, 'staffUsers', userCredential.user.uid)
        batch.set(newUserRef, {
          id: userCredential.user.uid,
          name: 'Mark Ken (Superadmin)',
          email: email,
          role: 'Superadmin',
          status: 'active',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        })
        await batch.commit()
        return true
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') return false
        throw e
      }
    }

    // 2. Pre-registered Staff Activation
    const staffDocId = email.replace(/[^a-zA-Z0-9]/g, '_')
    const staffDocRef = doc(db, 'staffUsers', staffDocId)
    const staffSnapshot = await getDoc(staffDocRef)

    if (staffSnapshot.exists()) {
      const staffData = staffSnapshot.data()
      if (staffData.password === pass) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass)
        await updateProfile(userCredential.user, { displayName: staffData.name })

        const batch = writeBatch(db)
        const newUserRef = doc(db, 'staffUsers', userCredential.user.uid)
        const { password: _, ...dataToSave } = staffData 
        
        batch.set(newUserRef, {
          ...dataToSave,
          id: userCredential.user.uid,
          lastLogin: serverTimestamp(),
          status: 'active',
          updatedAt: serverTimestamp()
        })
        batch.delete(staffDocRef)

        await batch.commit()
        return true
      }
    }

    return false
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Configuration Check
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('[YOUR_')) {
      setError("System Configuration Error: Missing API Credentials in .env file.")
      setIsLoading(false)
      return
    }

    try {
      // Step 1: Attempt Standard Login
      try {
        await signInWithEmailAndPassword(auth, email, password)
        toast({ title: "Welcome back!", description: "Successfully signed in." })
        router.push('/')
      } catch (signInErr: any) {
        // Step 2: If failed, check for first-time account activation
        const activated = await handleActivation(email, password)
        if (activated) {
          toast({ title: "Account Activated", description: "First-time setup complete." })
          router.push('/')
          return
        }
        throw signInErr
      }
    } catch (err: any) {
      console.error("Login Error:", err)
      let msg = "Invalid email or password."
      if (err.code === 'auth/network-request-failed') msg = "Network error. Please check your connection."
      if (err.code === 'auth/api-key-not-valid') msg = "Configuration error: Invalid API Key."
      
      setError(msg)
      toast({ variant: "destructive", title: "Login Failed", description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              <Leaf className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold">GulayanFlow</CardTitle>
          <CardDescription>
            Enter your credentials to access the inventory system.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase">System Message</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="markken@gulayan.ph" 
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-11 text-base font-bold" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Sign In"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Authorized personnel only.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
