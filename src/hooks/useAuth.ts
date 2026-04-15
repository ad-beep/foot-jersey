'use client';

import { useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import type { UserProfile } from '@/stores/auth-store';

// Module-level flag: only ONE onAuthStateChanged listener is ever registered,
// regardless of how many components call useAuth(). This prevents duplicate
// Firestore reads and store updates when multiple components mount.
let listenerRegistered = false;

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();
  // Read store actions via getState() inside callbacks to always get latest
  // references without creating stale closure problems.
  const listenerRegisteredRef = useRef(listenerRegistered);

  useEffect(() => {
    // Guard: only register the listener once across all component instances
    if (listenerRegisteredRef.current) return;
    listenerRegistered = true;
    listenerRegisteredRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check Firestore for existing profile
        const docRef = doc(db, 'users', firebaseUser.uid);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch {
          // Network error — fall back to cached auth data
          const cachedUser = useAuthStore.getState().user;
          if (!cachedUser || cachedUser.uid !== firebaseUser.uid) {
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              savedSize: null,
              savedKidsSize: null,
              newsletter: false,
              shippingAddresses: [],
              orderHistory: [],
            };
            useAuthStore.getState().setUser(fallbackProfile);
          }
          return;
        }

        if (docSnap.exists()) {
          // Merge any fresher Firebase Auth fields (e.g. displayName updated after creation)
          const stored = docSnap.data() as UserProfile;
          const merged: UserProfile = {
            ...stored,
            // Always trust Firebase Auth as the source of truth for these fields
            email: firebaseUser.email || stored.email,
            displayName: firebaseUser.displayName || stored.displayName,
            photoURL: firebaseUser.photoURL || stored.photoURL,
          };
          useAuthStore.getState().setUser(merged);
        } else {
          // New user — create Firestore document
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            savedSize: null,
            savedKidsSize: null,
            newsletter: false,
            shippingAddresses: [],
            orderHistory: [],
          };
          await setDoc(docRef, newProfile);
          useAuthStore.getState().setUser(newProfile);
        }

        // Sync favorites: merge local (anonymous) favorites with Firestore favorites
        // This runs after setUser so the auth store is populated before any writes.
        await useFavoritesStore.getState().syncFromFirestore(firebaseUser.uid);
      } else {
        // User signed out — wipe all user-specific state
        useAuthStore.getState().clearUser();
        useCartStore.getState().clearCart();
        useFavoritesStore.getState().clearFavorites();
      }
    });

    return () => {
      unsubscribe();
      // Reset so the listener can be re-registered if the module hot-reloads in dev
      listenerRegistered = false;
      listenerRegisteredRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  /**
   * Creates a new Firebase Auth user, sets the displayName immediately,
   * then manually writes the Firestore profile document. This avoids the
   * race condition where onAuthStateChanged fires for the new user before
   * updateProfile resolves, causing the Firestore doc to be created with
   * an empty displayName.
   */
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Update displayName on Firebase Auth FIRST (before Firestore write)
      if (displayName?.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }

      // Manually create the Firestore user doc with the correct displayName.
      // This prevents the onAuthStateChanged handler from creating a doc with
      // an empty displayName (race condition).
      const docRef = doc(db, 'users', credential.user.uid);
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email || '',
        displayName: displayName?.trim() || '',
        photoURL: credential.user.photoURL || '',
        savedSize: null,
        savedKidsSize: null,
        newsletter: false,
        shippingAddresses: [],
        orderHistory: [],
      };
      await setDoc(docRef, newProfile, { merge: true });
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear stores first so UI updates immediately, then sign out from Firebase
      useAuthStore.getState().clearUser();
      useCartStore.getState().clearCart();
      useFavoritesStore.getState().clearFavorites();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
