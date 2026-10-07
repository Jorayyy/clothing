'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';
import { IconAlert, IconCheck, IconClose, IconInfo } from './icons';

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (message: string, tone?: Tone, action?: ToastItem['action']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

const TONE_ICON = {
  success: IconCheck,
  error: IconAlert,
  info: IconInfo,
} as const;

const TONE_CLASS: Record<Tone, string> = {
  success: 'border-l-emerald-600',
  error: 'border-l-red-600',
  info: 'border-l-ink',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>((message, tone = 'info', action) => {
    const id = nextId.current++;
    setItems((current) => [...current.slice(-3), { id, message, tone, action }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 5200);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  const Icon = TONE_ICON[item.tone];

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-line border-l-4 bg-surface px-4 py-3 shadow-lg',
        TONE_CLASS[item.tone],
      )}
    >
      <span className="mt-0.5 shrink-0 text-ink">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-ink">{item.message}</p>
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-accent hover:underline"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="-mr-1 shrink-0 rounded-full p-1 text-muted hover:text-ink"
      >
        <IconClose size={14} />
      </button>
    </div>
  );
}
