
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Tags, 
  BrainCircuit, 
  User, 
  ShoppingBasket, 
  Truck, 
  FileText,
  CreditCard,
  ShieldCheck,
  Leaf,
  Loader2,
  Settings
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, collectionGroup, query, onSnapshot, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Orders", url: "/orders", icon: ShoppingBasket },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Stock Tracking", url: "/stock", icon: History },
  { title: "Categories", url: "/categories", icon: Tags },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "AI Insights", url: "/insights", icon: BrainCircuit },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Admin Management", url: "/admin", icon: ShieldCheck, adminOnly: true },
  { title: "Store Settings", url: "/settings", icon: Settings, adminOnly: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()
  const [pendingCount, setPendingCount] = React.useState(0)

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(staffRef)

  // Real-time listener for ALL pending orders across all customer profiles
  React.useEffect(() => {
    if (!db || !user || user.isAnonymous) return
    
    // Explicitly target 'pending' orders for notification badge
    const q = query(
      collectionGroup(db, 'orders'),
      where('status', '==', 'pending')
    )
    
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length)
    }, (error: any) => {
      // Gracefully log if index is missing
      if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
        console.warn("Sidebar: Orders indicator requires a collection group index.")
      }
    })
    
    return () => unsub()
  }, [db, user])

  if (pathname === '/login' || (!user || user.isAnonymous)) {
    return null
  }

  const isSuperadmin = user?.email === 'markken@gulayan.ph' || profile?.role === 'Superadmin'
  const isAdmin = profile?.role === 'Admin' || isSuperadmin

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shrink-0">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-headline font-bold text-lg leading-tight truncate">GulayanFlow</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">Gemma's Gulayan</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center">
            Navigation
            {isProfileLoading && <Loader2 className="h-3 w-3 animate-spin opacity-50" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                if (item.adminOnly && !isAdmin) return null;

                const isOrders = item.title === "Orders"

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <Link href={item.url} className="flex items-center gap-3 relative">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        {isOrders && pendingCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 min-w-5 p-0 flex items-center justify-center rounded-full animate-pulse text-[10px] font-bold"
                          >
                            {pendingCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t bg-muted/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile">
              <Link href="/profile" className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <span>My Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
