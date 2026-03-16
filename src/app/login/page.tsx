
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

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to GulayanFlow.",
      })
      router.push('/')
    } catch (err: any) {
      console.log("Auth attempt failed, checking database for activation...", err.code)
      
      const isUserNotFound = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password';
      
      if (isUserNotFound) {
        try {
          const staffQuery = query(
            collection(db, 'staffUsers'), 
            where('email', '==', email)
          )
          const querySnapshot = await getDocs(staffQuery)

          if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0]
            const staffData = staffDoc.data()

            if (staffData.password === password) {
              if (password.length < 6) {
                setError("Firebase requires a password of at least 6 characters. Please update the staff record in the Admin panel.")
                setIsLoading(false)
                return
              }

              const userCredential = await createUserWithEmailAndPassword(auth, email, password)
              
              await updateProfile(userCredential.user, {
                displayName: staffData.name
              })

              const batch = writeBatch(db)
              const newUserRef = doc(db, 'staffUsers', userCredential.user.uid)
              const oldUserRef = doc(db, 'staffUsers', staffDoc.id)

              // Migrate data from placeholder to UID-based document
              batch.set(newUserRef, {
                ...staffData,
                id: userCredential.user.uid,
                lastLogin: serverTimestamp(),
                status: 'active'
              })

              // Delete the placeholder if it's different from the UID (it usually is)
              if (staffDoc.id !== userCredential.user.uid) {
                batch.delete(oldUserRef)
              }

              await batch.commit()

              toast({
                title: "Account Activated",
                description: `Welcome, ${staffData.name}! Your account is now active.`,
              })
              router.push('/')
              return
            }
          }
        } catch (dbErr) {
          console.error("Database activation check failed:", dbErr)
        }
      }

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
      <Card className="w-full max-w-md shadow-xl border-none animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
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
                <AlertTitle className="text-xs font-bold uppercase">Auth Error</AlertTitle>
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
                  placeholder="name@gulayan.ph" 
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
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
            <Button className="w-full h-11 text-base font-bold shadow-lg shadow-primary/10" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Authorized staff only. Contact your Admin for account setup.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
