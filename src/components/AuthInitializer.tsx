'use client';

import { useEffect, useState } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 'cat-veg', name: 'Vegetables', description: 'Fresh leafy greens and more', icon: 'LeafyGreen' },
  { id: 'cat-fruit', name: 'Fruits', description: 'Sweet and seasonal fruits', icon: 'Apple' },
  { id: 'cat-root', name: 'Root Crops', description: 'Fresh highland produce', icon: 'Carrot' },
  { id: 'cat-grain', name: 'Grains', description: 'Rice and local grains', icon: 'Wheat' },
  { id: 'cat-spice', name: 'Spices', description: 'Onions, garlic, and more', icon: 'Flame' },
];

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      if (!auth || !db || isUserLoading) return;

      try {
        if (!user) {
          setIsInitializing(false);
          return;
        }

        const userDocRef = doc(db, 'staffUsers', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // Forced Superadmin check
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
          if (isSuperadminEmail && userDoc.data()?.role !== 'Superadmin') {
            updates.role = 'Superadmin';
          }
          await setDoc(userDocRef, updates, { merge: true });
        }

        // Seed Categories if empty
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        if (categoriesSnapshot.empty) {
          const batch = writeBatch(db);
          DEFAULT_CATEGORIES.forEach((cat) => {
            const ref = doc(db, 'categories', cat.id);
            batch.set(ref, cat);
          });
          await batch.commit();
        }

        setIsInitializing(false);
      } catch (error) {
        console.error("Initialization failure:", error);
        setIsInitializing(false);
      }
    }

    init();
  }, [auth, db, user, isUserLoading]);

  if (isUserLoading || isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing GulayanFlow...</p>
      </div>
    );
  }

  return <>{children}</>;
}