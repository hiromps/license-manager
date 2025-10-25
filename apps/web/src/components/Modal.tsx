import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '800px' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-2xl)',
          padding: '2rem',
          maxWidth,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-2xl)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--gray-100)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--gray-100)',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              color: 'var(--gray-600)',
              borderRadius: 'var(--radius-md)',
              transition: 'var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--danger-100)';
              e.currentTarget.style.color = 'var(--danger-600)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--gray-100)';
              e.currentTarget.style.color = 'var(--gray-600)';
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
