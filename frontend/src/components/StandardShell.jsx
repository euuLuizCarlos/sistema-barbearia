import React from 'react';
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png';

export default function StandardShell({ children, className }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7fafc',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      padding: '20px 12px'
    }}>
      {/* Header bar with logo */}
      <div style={{
        backgroundColor: '#023047',
        padding: '18px 20px',
        borderRadius: '8px',
        maxWidth: '1100px',
        margin: '0 auto 18px auto',
        boxSizing: 'border-box',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={barberLogo} alt="Logo" style={{ maxWidth: '180px', height: 'auto' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#FFB703', lineHeight: '1.2' }}>Bem-vindo(a) ao seu espaço.</h1>
            <div style={{ color: '#e6eef2', fontSize: '0.95rem', marginTop: '4px' }}>Onde a tradição encontra o seu estilo.</div>
          </div>
        </div>
      </div>

      {/* Content panel: white background so child pages keep their styles */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
        boxSizing: 'border-box',
      }} className={className}>
        {children}
      </div>
    </div>
  );
}
