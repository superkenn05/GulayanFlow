'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

// Use global variables to ensure singletons across hot-reloads and re-renders.
// This prevents "Unexpected state" assertion errors in the Firebase SDK (like ID: ca9).
let globalApp: FirebaseApp | undefined;
let globalAuth: Auth | undefined;
let globalFirestore: Firestore | undefined;

/**
 * Initializes and returns Firebase SDK instances.
 * Implements a singleton pattern to prevent multiple instances from being created,
 * which can cause internal SDK errors in Next.js development mode.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    // Basic SSR fallback: initialize or retrieve the app for server-side logic.
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  // Ensure the App is initialized only once.
  if (!globalApp) {
    if (!getApps().length) {
      try {
        // Attempt to initialize via Firebase App Hosting environment variables (production).
        globalApp = initializeApp();
      } catch (e) {
        // Fallback to local config (development).
        globalApp = initializeApp(firebaseConfig);
      }
    } else {
      globalApp = getApp();
    }
  }

  // Ensure Auth and Firestore are initialized as singletons for the app.
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

/**
 * Utility to get SDKs for a specific app instance.
 * Favors the initializeFirebase() logic for standard usage.
 */
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
