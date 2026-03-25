'use client';

import { useState, useEffect } from 'react';

// Prevents hydration mismatch for zustand persisted stores
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
