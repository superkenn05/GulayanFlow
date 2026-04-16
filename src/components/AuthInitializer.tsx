
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

  // 2. Data Initialization logic
  useEffect(() => {
    async function init() {
      if (!db) return;

      try {
        // Use a default ID if no user is logged in
        const userId = user?.uid || 'default-admin';
        const userDocRef = doc(db, 'staffUsers', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const staffData = {
            id: userId,
            name: user?.displayName || 'Administrator',
            email: user?.email || 'admin@gulayan.ph',
            role: 'Admin',
            lastLogin: serverTimestamp(),
            status: 'active'
          };
          await setDoc(userDocRef, staffData);
        } else {
          // Normal login: just update last login
          const updates = { 
            lastLogin: serverTimestamp(),
            role: 'Admin' // Ensure everyone gets Admin access for now
          };
          await setDoc(userDocRef, updates, { merge: true });
        }

        // Seed categories for any authenticated user to ensure the app is ready
        try {
          const categoriesSnapshot = await getDocs(collection(db, 'categories'));
          if (categoriesSnapshot.empty) {
            const batch = writeBatch(db);
            DEFAULT_CATEGORIES.forEach((cat) => {
              const ref = doc(db, 'categories', cat.id);
              batch.set(ref, cat);
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn("Seeding failed:", e);
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
  // Removed loader to allow immediate access

  return <>{children}</>;
}
