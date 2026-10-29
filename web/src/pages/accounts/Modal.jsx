import React from 'react';

export default function Modal({ isOpen, onClose, titolo, children }) {
  if (!isOpen) return null;

  // Funzione per chiudere il modale cliccando sullo sfondo scuro
  const handleOverlayClick = (e) => {
    // Chiude solo se il click è esattamente sull'overlay, non sui figli
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle} className="card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{titolo}</h2>
          
          {/* type="button" impedisce che venga scambiato per il tasto "Invia" del form */}
          <button type="button" onClick={onClose} style={closeButtonStyle} title="Chiudi">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '1rem', backdropFilter: 'blur(2px)'
};

const modalStyle = {
  backgroundColor: 'var(--bg-card, #fff)', width: '100%', maxWidth: '600px',
  maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
  borderRadius: '8px', position: 'relative',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
};

const closeButtonStyle = {
  background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
  color: 'var(--text, #333)'
};