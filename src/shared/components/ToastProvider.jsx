/*
 * ToastProvider exposes a lightweight notification system so async actions,
 * like AI requests, can surface feedback anywhere in the UI tree.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext(null);

let idSeq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((toast) => {
    const id = idSeq++;
    const t = { id, duration: 5000, ...toast };
    setToasts((prev) => [...prev, t]);
    if (t.duration > 0) setTimeout(() => remove(id), t.duration);
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    success: (message) => push({ type: 'success', message }),
    error: (message) => push({ type: 'error', message }),
    info: (message) => push({ type: 'info', message }),
    remove,
  }), [push, remove]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + (t.type || 'info')} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
