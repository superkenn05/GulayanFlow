"use client"

import { usePathname } from 'next/navigation'
import { useUser } from '@/firebase'

export function LayoutHeaderHider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()

  // Hide the header on the login page or if not officially logged in
  if (pathname === '/login' || !user || user.isAnonymous) {
    return null
  }

  return <>{children}</>
}