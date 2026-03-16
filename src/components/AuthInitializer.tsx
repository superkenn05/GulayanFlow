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
      // Wait for Firebase services to be available and initial auth state to be determined
      if (!auth || !db || isUserLoading) return;

      try {
        let currentUser = user;
        
        // If no user is signed in, sign in anonymously
        if (!currentUser) {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
        }

        // Crucially, always ensure the staff profile document exists in Firestore.
        // This handles cases where a user is signed in but their DB record is missing.
        const userDocRef = doc(db, 'staffUsers', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            id: currentUser.uid,
            name: 'Gemma (Admin)',
            email: 'gemma@gulayan.ph',
            role: 'Admin',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
          // Update last login for existing users
          await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    }

    init();
  }, [auth, db, user, isUserLoading]);

  // Gate the application rendering until authentication and profile setup are complete
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
