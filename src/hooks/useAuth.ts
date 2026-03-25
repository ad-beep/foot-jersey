'use client';

import { useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import type { UserProfile } from '@/stores/auth-store';

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check Firestore for existing profile
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUser(docSnap.data() as UserProfile);
        } else {
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
          setUser(newProfile);
        }
      } else {
        clearUser();
      }
    });
    return () => unsubscribe();
  }, [setUser, clearUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      console.error('Apple sign-in error:', error);
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

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      clearUser();
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
