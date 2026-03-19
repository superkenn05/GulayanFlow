'use client';

import { useEffect, useState } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const DEFAULT_CATEGORIES = [
  { id: 'cat-veg', name: 'Vegetables', description: 'Fresh leafy greens and more', icon: 'LeafyGreen' },
  { id: 'cat-fruit', name: 'Fruits', description: 'Sweet and seasonal fruits', icon: 'Apple' },
  { id: 'cat-root', name: 'Root Crops', description: 'Fresh highland produce', icon: 'Carrot' },
  { id: 'cat-grain', name: 'Grains', description: 'Rice and local grains', icon: 'Wheat' },
  { id: 'cat-spice', name: 'Spices', description: 'Onions, garlic, and more', icon: 'Flame' },
];

/**
 * AuthInitializer handles:
 * 1. Global Authentication Guard (redirect to /login if not authenticated)
 * 2. Staff profile initialization/migration
 * 3. Superadmin activation
 * 4. Default categories seeding
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // 1. Guard logic: Redirect to login if unauthenticated and not already on the login page
  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  // 2. Data Initialization logic
  useEffect(() => {
    async function init() {
      // Don't run initialization if auth is still loading or if there's no user
      if (!auth || !db || isUserLoading) return;

      if (!user) {
        setIsInitializing(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'staffUsers', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // Forced Superadmin check: Only one specific email can ever be Superadmin
        const isSuperadminEmail = user.email === 'markken@gulayan.ph';

        if (!userDoc.exists()) {
          const staffData = {
            id: user.uid,
            name: isSuperadminEmail ? 'Mark Ken (Superadmin)' : (user.displayName || 'Staff Member'),
            email: user.email,
            role: isSuperadminEmail ? 'Superadmin' : 'Staff',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            status: 'active'
          };
          await setDoc(userDocRef, staffData);
        } else {
          // Update last login and ensure role is correct for the superadmin email
          const updates: any = { lastLogin: serverTimestamp() };
          
          if (isSuperadminEmail) {
            updates.role = 'Superadmin';
          }
          
          await setDoc(userDocRef, updates, { merge: true });
        }

        // Only the Superadmin should attempt to seed categories to avoid permission errors for regular staff
        if (isSuperadminEmail) {
          const categoriesSnapshot = await getDocs(collection(db, 'categories'));
          if (categoriesSnapshot.empty) {
            const batch = writeBatch(db);
            DEFAULT_CATEGORIES.forEach((cat) => {
              const ref = doc(db, 'categories', cat.id);
              batch.set(ref, cat);
            });
            await batch.commit();
          }
        }

        setIsInitializing(false);
      } catch (error) {
        console.error("Initialization failure:", error);
        setIsInitializing(false);
      }
    }

    init();
  }, [auth, db, user, isUserLoading]);

  // Show a high-level loader only when we are verifying auth or performing critical first-run setup
  // We allow /login to render even if isInitializing is true, provided user is null
  const shouldShowLoader = isUserLoading || (user && isInitializing);

  if (shouldShowLoader) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-tight">
          Securing your session...
        </p>
      </div>
    );
  }

  // To prevent flash of protected content during redirection
  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
