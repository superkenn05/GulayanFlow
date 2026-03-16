
'use client';

import { useEffect, useState } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
        let currentUser = user;
        
        // If not logged in, we stay on the login page (or use anonymous for first-run probing)
        if (!currentUser) {
          // Note: Anonymous is only used if absolutely necessary for initial seeding
          // Most apps will just wait for actual sign-in.
          setIsInitializing(false);
          return;
        }

        // 1. Ensure Staff Profile exists at the current UID
        const userDocRef = doc(db, 'staffUsers', currentUser.uid);
        let userDoc;
        
        try {
          userDoc = await getDoc(userDocRef);
        } catch (e: any) {
          // If we get a permission error here, it might be because the user is anonymous
          // and hasn't logged in yet. That's fine.
          setIsInitializing(false);
          return;
        }
        
        // If profile doesn't exist AND it's a real user, create a default profile
        // If it's an anonymous user, we don't necessarily want to create a staff record
        if (!userDoc.exists() && !currentUser.isAnonymous) {
          const staffData = {
            id: currentUser.uid,
            name: currentUser.displayName || 'Staff Member',
            email: currentUser.email || 'staff@gulayan.ph',
            role: 'Staff',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            status: 'active'
          };

          try {
            await setDoc(userDocRef, staffData);
          } catch (e: any) {
            console.warn("Could not create initial staff profile:", e);
          }
        } else if (userDoc.exists()) {
          // Update last login
          setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true }).catch(() => {});
        }

        // 2. Seed Default Categories if empty (Global data, only needs to happen once)
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
          console.warn("Could not seed categories during init:", e);
        }

        setIsInitializing(false);
      } catch (error) {
        console.error("Critical initialization failure:", error);
        setIsInitializing(false);
      }
    }

    init();
  }, [auth, db, user, isUserLoading]);

  if (isUserLoading || isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing Gemma's Gulayan...</p>
      </div>
    );
  }

  return <>{children}</>;
}
