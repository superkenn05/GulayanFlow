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
  Leaf
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
import { useUser } from "@/firebase"

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
  { title: "Admin Management", url: "/admin", icon: ShieldCheck },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  // Hide sidebar if unauthenticated or on login page
  if (pathname === '/login' || (!user || user.isAnonymous)) {
    return null
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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