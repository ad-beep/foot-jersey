import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface AuditEntry {
  action: string;
  adminEmail: string;
  details?: Record<string, unknown>;
}

/**
 * Write an audit log entry to Firestore via the Admin SDK. Best-effort — never throws.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await getAdminDb().collection('adminAuditLog').add({
      ...entry,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[audit-log] Failed to write entry:', err);
  }
}
