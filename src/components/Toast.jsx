import React, { useState, useCallback } from 'react';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className="bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-secondary/30 animate-in slide-in-from-right">
          {t.msg}
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}
