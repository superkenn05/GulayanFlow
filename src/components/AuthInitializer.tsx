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
        
        if (!currentUser) {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
        }

        // 1. Ensure Staff Profile exists
        const userDocRef = doc(db, 'staffUsers', currentUser.uid);
        let userDoc;
        
        try {
          // Attempt to get the user document to check for existence
          userDoc = await getDoc(userDocRef);
        } catch (e: any) {
          // Surface permission error if critical
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
          return;
        }
        
        if (!userDoc.exists()) {
          const staffData = {
            id: currentUser.uid,
            name: 'Gemma (Admin)',
            email: 'gemma@gulayan.ph',
            role: 'Admin',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };

          try {
            await setDoc(userDocRef, staffData);
          } catch (e: any) {
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'create',
              requestResourceData: staffData,
            });
            errorEmitter.emit('permission-error', permissionError);
            return;
          }
        } else {
          // Update last login timestamp quietly
          setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true }).catch(() => {});
        }

        // 2. Seed Default Categories if empty
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
          // Seeding failure is non-critical if it's a permission issue (e.g., user doc not yet indexed)
          console.warn("Could not seed categories during init:", e);
        }

        setIsInitializing(false);
      } catch (error) {
        console.error("Critical initialization failure:", error);
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