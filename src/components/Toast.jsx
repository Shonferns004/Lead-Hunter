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
    <>
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
