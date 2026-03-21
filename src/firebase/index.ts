
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

// Use global variables to ensure singletons across hot-reloads and re-renders.
let globalApp: FirebaseApp | undefined;
let globalAuth: Auth | undefined;
let globalFirestore: Firestore | undefined;

/**
 * Initializes and returns Firebase SDK instances.
 * Implements a singleton pattern to prevent multiple instances from being created.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  if (!globalApp) {
    if (!getApps().length) {
      // Prioritize the explicit config object which reads from NEXT_PUBLIC env vars
      globalApp = initializeApp(firebaseConfig);
    } else {
      globalApp = getApp();
    }
  }

  if (!globalAuth) {
    globalAuth = getAuth(globalApp);
  }

  if (!globalFirestore) {
    globalFirestore = getFirestore(globalApp);
  }

  return {
    firebaseApp: globalApp,
    auth: globalAuth,
    firestore: globalFirestore
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
