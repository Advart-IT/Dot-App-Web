import React, { useRef, useEffect } from 'react';

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const AppModal: React.FC<AppModalProps> = ({ open, onClose, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Blur previous active element
      if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
        (document.activeElement as HTMLElement).blur();
      }
      // Focus first button inside modal
      setTimeout(() => {
        if (modalRef.current) {
          const btn = modalRef.current.querySelector('button');
          if (btn) (btn as HTMLElement).focus();
        }
      }, 0);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        const active = document.activeElement;
        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: 'none'
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '300px', outline: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', // Added shadow for depth
          maxWidth: '90%', // Responsive design
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#333' }}>Modal Title</h3>
          <button onClick={onClose} style={{ fontSize: '20px', fontWeight: 'bold', border: 'none', background: 'transparent', cursor: 'pointer', color: '#888' }} aria-label="Close">×</button>
        </div>
        <div style={{ color: '#555', lineHeight: '1.5' }}>{children}</div> {/* Improved text color and line height */}
      </div>
    </div>
  );
};

export default AppModal;