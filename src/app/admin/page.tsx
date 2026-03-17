"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus, MoreVertical, Loader2, Lock } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore'
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { toast } from '@/hooks/use-toast'

export default function AdminManagementPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)
  
  const isSuperadmin = user?.email === 'markken@gulayan.ph'
  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || isSuperadmin

  const staffQuery = useMemoFirebase(() => isAdmin ? query(collection(db, 'staffUsers'), orderBy('createdAt', 'desc')) : null, [db, isAdmin])
  const { data: staff, isLoading } = useCollection(staffQuery)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    password: ''
  })

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
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
        status: 'active'
      }, { merge: true })

      toast({ title: "Staff Member Added", description: `${formData.name} has been pre-registered.` })
      setIsDialogOpen(false)
      setFormData({ name: '', email: '', role: 'Staff', password: '' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    updateDocumentNonBlocking(doc(db, 'staffUsers', id), { status: newStatus })
    toast({ title: "Status Updated", description: `Account is now ${newStatus}.` })
  }

  const handleRoleChange = (id: string, newRole: string) => {
    updateDocumentNonBlocking(doc(db, 'staffUsers', id), { role: newRole })
    toast({ title: "Role Updated", description: `Role changed to ${newRole}.` })
  }

  const handleDeleteStaff = (id: string, name: string) => {
    deleteDocumentNonBlocking(doc(db, 'staffUsers', id))
    toast({ title: "Account Removed", description: `${name}'s account has been deleted.` })
  }

  if (isProfileLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div>
  if (!isAdmin) return <div className="flex flex-col items-center justify-center h-[60vh]"><Lock className="h-8 w-8 text-destructive mb-2" /><h2 className="text-xl font-bold">Access Denied</h2></div>

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">Admin Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions.</p>
        </div>
        
        {isSuperadmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><UserPlus className="h-4 w-4" /> Add Staff/Admin</Button></DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSaveStaff}>
                <DialogHeader>
                  <DialogTitle>Add New Personnel</DialogTitle>
                  <DialogDescription>Create a pre-registered account for your staff.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input placeholder="Full Name" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                  <Input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                  <Select value={formData.role} onValueChange={val => setFormData(p => ({ ...p, role: val }))}>
                    <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent>
                  </Select>
                  <Input type="password" placeholder="Temporary Password" required value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                </div>
                <DialogFooter><Button type="submit" disabled={isSaving}>Save User</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Staff Directory</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {isSuperadmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                      {member.status || 'active'}
                    </Badge>
                  </TableCell>
                  {isSuperadmin && (
                    <TableCell className="text-right">
                      {member.email !== user?.email && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusToggle(member.id, member.status || 'active')}>
                              Mark as {member.status === 'active' ? 'Inactive' : 'Active'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.role === 'Admin' ? 'Staff' : 'Admin')}>
                              Promote/Demote
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStaff(member.id, member.name)}>
                              Remove Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 opacity-50">Loading staff data...</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
