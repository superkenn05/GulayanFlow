
"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Leaf, Loader2, Lock, Mail, AlertCircle } from "lucide-react"
import { useAuth, useUser } from '@/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
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

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "Welcome back!", description: "Successfully signed in." })
      router.push('/')
    } catch (err: any) {
      console.error("Auth Error:", err)
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid credentials. Please try again." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isConfigMissing = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Leaf className="h-9 w-9" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">GulayanFlow</CardTitle>
          <CardDescription>
            Enter your credentials to access the store management system.
          </CardDescription>
        </CardHeader>
        
        {isConfigMissing && (
          <div className="px-6 pb-4">
            <Alert variant="destructive" className="bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                System configuration is incomplete. Check environment variables.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@gulayan.ph" 
                  className="pl-10 h-12 rounded-xl focus:ring-primary/20"
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
                  placeholder="••••••••"
                  className="pl-10 h-12 rounded-xl focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button 
              className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20" 
              type="submit" 
              disabled={isLoading || isConfigMissing}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Sign In"}
            </Button>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-60">
                Authorized Personnel Only
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
