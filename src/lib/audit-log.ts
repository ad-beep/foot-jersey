import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditEntry {
  action: string;
  adminEmail: string;
  details?: Record<string, unknown>;
}

/**
 * Write an audit log entry to Firestore. Best-effort — never throws.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await addDoc(collection(db, 'adminAuditLog'), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('[audit-log] Failed to write entry:', err);
  }
}
