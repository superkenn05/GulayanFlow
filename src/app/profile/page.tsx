
"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, LogOut, Save } from "lucide-react"
import { MOCK_STAFF } from '../lib/mock-data'

export default function ProfilePage() {
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
              <AvatarImage src="https://picsum.photos/seed/staff/200" />
              <AvatarFallback>GC</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{MOCK_STAFF.name}</CardTitle>
            <Badge className="mt-2 bg-primary">{MOCK_STAFF.role.toUpperCase()}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {MOCK_STAFF.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Full System Access
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
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
                  <Input id="name" defaultValue={MOCK_STAFF.name} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" defaultValue={MOCK_STAFF.email} className="pl-10" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Change Password</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input id="current" type="password" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input id="new" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input id="confirm" type="password" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end bg-muted/30 border-t">
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
