import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Toast.css';

const Toast = () => {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const removeTimerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
    setVisible(false);

    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    removeTimerRef.current = setTimeout(() => setToast(null), 300);
  }, []);

  useEffect(() => {
    const handleShowToast = (event) => {
      const { message, type = 'success' } = event.detail || {};
      if (!message) return;

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

      setToast({ message, type });
      setVisible(true);
      // Errors contain an action the guest needs time to read.
      hideTimerRef.current = setTimeout(hideToast, type === 'error' ? 6000 : 3000);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => {
      window.removeEventListener('show-toast', handleShowToast);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, [hideToast]);

  if (!toast) return null;

  const iconByType = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div
      className={`toast-container ${visible ? 'show' : ''} toast-${toast.type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-icon">{iconByType[toast.type] || iconByType.info}</div>
      <div className="toast-message">{toast.message}</div>
    </div>
  );
};

export default Toast;
