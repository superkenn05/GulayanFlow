
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('[YOUR_')) {
      setError("Firebase Configuration is missing. Please add your API Key to the .env file.")
      setIsLoading(false)
      return
    }

    try {
      // 1. Try standard login first
      try {
        await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        })
        router.push('/')
        return
      } catch (signInErr: any) {
        // Handle specific Firebase error codes
        if (signInErr.code === 'auth/api-key-not-valid' || signInErr.code === 'auth/invalid-api-key') {
          setError("The Firebase API Key in your .env file is invalid or missing.")
          setIsLoading(false)
          return
        }

        const isAuthError = signInErr.code === 'auth/user-not-found' || 
                           signInErr.code === 'auth/invalid-credential' || 
                           signInErr.code === 'auth/wrong-password';

        if (isAuthError) {
          // 2. Handle Activation Scenarios
          
          // Scenario A: Superadmin Activation
          if (email === 'markken@gulayan.ph' && (password === 'admin123456789' || password === 'admin12345678')) {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password)
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
              
              toast({ title: "Superadmin Activated", description: "Welcome, Mark Ken!" })
              router.push('/')
              return
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                // If account exists but login failed, it's just a wrong password
                setError("Incorrect password for this account.")
              } else {
                throw createErr
              }
            }
          }

          // Scenario B: Staff Activation
          const staffDocId = email.replace(/[^a-zA-Z0-9]/g, '_')
          const staffDocRef = doc(db, 'staffUsers', staffDocId)
          const staffSnapshot = await getDoc(staffDocRef)

          if (staffSnapshot.exists()) {
            const staffData = staffSnapshot.data()

            if (staffData.password === password) {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password)
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
              toast({ title: "Account Activated", description: `Welcome, ${staffData.name}!` })
              router.push('/')
              return
            }
          }
        }
        
        throw signInErr
      }
    } catch (err: any) {
      console.error("Login Error:", err)
      setError(err.message || "Invalid email or password.")
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your credentials.",
      })
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
            Enter your credentials to manage Gemma's Gulayan.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase">Configuration or Auth Error</AlertTitle>
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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
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
