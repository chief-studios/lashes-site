import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onCancel}
      role="presentation"
    >
      <style>{`
        @keyframes confirmModalScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(255, 20, 147, 0.2)',
          textAlign: 'center',
          animation: 'confirmModalScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          color: '#111827',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: confirmVariant === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 20, 147, 0.12)',
            color: confirmVariant === 'danger' ? '#ef4444' : '#FF1493',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#111827' }}>
          {title}
        </h3>

        <p style={{ fontSize: '0.95rem', color: '#4b5563', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              borderRadius: '50px',
              border: '1.5px solid #d1d5db',
              background: '#ffffff',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              borderRadius: '50px',
              border: 'none',
              background: confirmVariant === 'danger' ? '#dc2626' : 'var(--primary-pink, #FF1493)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: confirmVariant === 'danger' ? '0 4px 14px rgba(220, 38, 38, 0.35)' : '0 4px 14px rgba(255, 20, 147, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
