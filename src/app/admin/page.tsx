
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus, Shield, MoreVertical, Loader2, Trash2, Lock, Key, ShieldCheck, UserCheck, UserX } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore'
import { deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { toast } from '@/hooks/use-toast'

export default function AdminManagementPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)
  
  const staffQuery = useMemoFirebase(() => query(collection(db, 'staffUsers'), orderBy('createdAt', 'desc')), [db])
  const { data: staff, isLoading } = useCollection(staffQuery)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    password: ''
  })

  // The Single Superadmin check
  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      // Create a unique ID for the placeholder document based on email
      const staffDocId = formData.email.replace(/[^a-zA-Z0-9]/g, '_')
      const staffDocRef = doc(db, 'staffUsers', staffDocId)
      
      setDocumentNonBlocking(staffDocRef, {
        id: staffDocId,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        status: 'active' // Initial status
      }, { merge: true })

      toast({ title: "Staff Member Added", description: `${formData.name} has been pre-registered.` })
      setIsDialogOpen(false)
      setFormData({ name: '', email: '', role: 'Staff', password: '' })
    } catch (error) {
      toast({ title: "Error", description: "Could not add staff.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStaff = (id: string, name: string) => {
    deleteDocumentNonBlocking(doc(db, 'staffUsers', id))
    toast({ title: "Staff Removed", description: `${name} has been removed.` })
  }

  const handleRoleChange = (id: string, newRole: string) => {
    updateDocumentNonBlocking(doc(db, 'staffUsers', id), { role: newRole })
    toast({ title: "Role Updated", description: `Staff role changed to ${newRole}.` })
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(db, 'staffUsers', id), { status: newStatus })
    toast({ title: "Status Updated", description: `Account status changed to ${newStatus}.` })
  }

  if (isProfileLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div>
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive"><Lock className="h-8 w-8" /></div>
        <h2 className="text-2xl font-headline font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">Only administrators can access this area.</p>
        <Button asChild variant="outline"><a href="/">Dashboard</a></Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            Admin Management {isSuperadmin ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
          </h1>
          <p className="text-muted-foreground">Manage roles and permissions for Gemma's Gulayan.</p>
        </div>
        
        {isSuperadmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add Staff/Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSaveStaff}>
                <DialogHeader>
                  <DialogTitle>Add New Personnel</DialogTitle>
                  <DialogDescription>Create a profile for a new staff member or administrator.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <input 
                      id="name" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Juan Dela Cruz" 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <input 
                      id="email" 
                      type="email" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="juan@gulayan.ph" 
                      required 
                      value={formData.email} 
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Initial Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type="password" className="pl-10" placeholder="Min. 6 characters" required value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{staff?.filter(s => s.role === 'Staff').length || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{staff?.filter(s => s.role === 'Admin').length || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Superadmin</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{staff?.filter(s => s.role === 'Superadmin').length || 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Manage all registered personnel and their permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://picsum.photos/seed/${member.id}/200`} />
                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'Superadmin' ? 'default' : member.role === 'Admin' ? 'secondary' : 'outline'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                      {member.status?.toUpperCase() || 'ACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isSuperadmin && member.email !== user?.email && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Account Controls</DropdownMenuLabel>
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                              <Shield className="h-4 w-4" /> Change Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'Admin')}>Administrator</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'Staff')}>Staff Member</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                              <UserCheck className="h-4 w-4" /> Modify Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'active')} className="gap-2">
                                  <UserCheck className="h-4 w-4 text-primary" /> Mark Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'inactive')} className="gap-2 text-destructive">
                                  <UserX className="h-4 w-4" /> Mark Inactive
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleDeleteStaff(member.id, member.name)}>
                            <Trash2 className="h-4 w-4" /> Remove Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
