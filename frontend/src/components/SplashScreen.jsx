// src/components/SplashScreen.jsx - CÓDIGO CORRIGIDO
import React from 'react';
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png'; 

const SplashScreen = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      color: '#333',
    }}>
      <img
        src={barberLogo}
        alt="Barber Logo"
        style={{ width: '900px', marginBottom: '20px' }} 
      />
      
      {/* Elemento que será estilizado como spinner */}
      <div className="spinner-container">
          <div className="spinner"></div> 
      </div>
      
      <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Carregando sistema...</p>

      {/* --- ESTILOS INLINE E CHAVES DE ANIMAÇÃO --- */}
      {/* Nota: Em um projeto final, estas tags de estilo seriam movidas para um arquivo CSS 
        global (ex: index.css) para que as animações @keyframes funcionem.
      */}
      <style>{`
        .spinner {
          border: 6px solid #f3f3f3; 
          border-top: 6px solid #1a2c38; 
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;