
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
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
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

  // If user is already logged in as a non-anonymous user, redirect to dashboard
  useEffect(() => {
    if (user && !user.isAnonymous) {
      router.push('/')
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. Attempt standard Firebase Auth Login
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to GulayanFlow.",
      })
      router.push('/')
    } catch (err: any) {
      console.log("Auth attempt failed, checking database for activation...", err.code)
      
      // 2. If login fails (user not found or invalid), check Firestore for pre-registered staff
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const staffQuery = query(
            collection(db, 'staffUsers'), 
            where('email', '==', email)
          )
          const querySnapshot = await getDocs(staffQuery)

          if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0]
            const staffData = staffDoc.data()

            // Check if the provided password matches the one in the database record
            // Note: In a real production app, passwords should never be stored in plain text.
            // This is a bridge for the user's specific requirement.
            if (staffData.password === password) {
              
              // Ensure password is at least 6 characters (Firebase requirement)
              if (password.length < 6) {
                setError("Firebase requires a password of at least 6 characters. Please ask your Admin to update your password record.")
                setIsLoading(false)
                return
              }

              // 3. Activation Flow: Create the Auth User
              const userCredential = await createUserWithEmailAndPassword(auth, email, password)
              
              // Update Auth Profile
              await updateProfile(userCredential.user, {
                displayName: staffData.name
              })

              // Update Firestore record with the new Auth UID
              const staffRef = doc(db, 'staffUsers', staffDoc.id)
              await updateDoc(staffRef, {
                id: userCredential.user.uid, // Sync UID
                lastLogin: serverTimestamp(),
                status: 'active'
              })

              toast({
                title: "Account Activated",
                description: `Welcome, ${staffData.name}! Your account is now active.`,
              })
              router.push('/')
              return
            }
          }
        } catch (dbErr) {
          console.error("Database verification failed:", dbErr)
        }
      }

      // If we reach here, it's a genuine failed login
      setError("Invalid email or password. Please try again.")
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
            Enter your credentials to access Gemma's Gulayan inventory.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase">Error</AlertTitle>
                <AlertDescription className="text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="gemma@gulayan.ph" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="px-0 font-normal text-xs text-muted-foreground">
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-11" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Authorized personnel only. Contact Admin for new account registration.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
