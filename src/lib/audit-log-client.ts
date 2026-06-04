'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditEntry {
  action: string;
  adminEmail: string;
  details?: Record<string, unknown>;
}

/**
 * Client-side audit log writer for the admin browser. Writes directly to
 * `adminAuditLog` via the client SDK — Firestore rules only allow this for the
 * signed-in admin (`allow create: if isAdmin()`). Server code uses the Admin
 * SDK version in `audit-log.ts` instead. Best-effort — never throws.
 */
export async function writeAuditLogClient(entry: AuditEntry): Promise<void> {
  try {
    await addDoc(collection(db, 'adminAuditLog'), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('[audit-log] client write failed:', err);
  }
}
