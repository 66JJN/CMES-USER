import React, { useEffect, useState, useCallback } from 'react';
import './Toast.css';

const Toast = () => {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  const hideToast = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 300); // รอ animation จบ
  }, []);

  useEffect(() => {
    const handleShowToast = (event) => {
      const { message, type } = event.detail;
      setToast({ message, type: type || 'success' });
      setVisible(true);

      // ตั้งเวลาลบอัตโนมัติ 3 วินาที
      const timer = setTimeout(hideToast, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [hideToast]);

  if (!toast) return null;

  return (
    <div className={`toast-container ${visible ? 'show' : ''} toast-${toast.type}`}>
      <div className="toast-icon">
        {toast.type === 'success' && '✓'}
        {toast.type === 'error' && '✕'}
        {toast.type === 'info' && 'ℹ'}
      </div>
      <div className="toast-message">{toast.message}</div>
    </div>
  );
};

export default Toast;
