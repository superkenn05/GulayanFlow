'use client';

import { useEffect, useState } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      if (!auth || !db) return;

      if (!isUserLoading && !user) {
        try {
          const cred = await signInAnonymously(auth);
          const userDoc = await getDoc(doc(db, 'staffUsers', cred.user.uid));
          
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'staffUsers', cred.user.uid), {
              id: cred.user.uid,
              name: 'Gemma (Admin)',
              email: 'gemma@gulayan.ph',
              role: 'Admin',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error("Initialization error:", error);
        }
      }
      setIsInitializing(false);
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
