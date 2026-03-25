'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

// ─── Context ──────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Colors ───────────────────────────────────────────────
const barColors: Record<ToastVariant, string> = {
  success: 'var(--success)',
  error:   'var(--error)',
  info:    'var(--accent)',
};

// ─── Single Toast ─────────────────────────────────────────
function ToastCard({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative max-w-[400px] w-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(26,26,26,0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute top-0 bottom-0 w-1 start-0"
        style={{ backgroundColor: barColors[data.variant] }}
      />

      <div className="flex items-start gap-3 px-4 py-3 ps-5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{data.title}</p>
          {data.description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {data.description}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[rgba(255,255,255,0.1)]"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: barColors[data.variant] }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 3, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────
let nextId = 0;

export function ToastProvider({ children, className }: { children: React.ReactNode; className?: string }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = ++nextId;
    setToasts((prev) => [...prev.slice(-2), { id, variant: 'info', ...input }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className={cn(className)}>{children}</div>

      {/* Toast container */}
      <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[80] flex flex-col-reverse items-center gap-2 pointer-events-none w-full px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard data={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
