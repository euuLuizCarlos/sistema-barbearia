import React, { createContext, useContext, useState, useCallback } from 'react';

const UiContext = createContext(null);

export const UiProvider = ({ children }) => {
  const [postIts, setPostIts] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // {message, resolve}
  const [promptState, setPromptState] = useState(null); // {message, resolve, placeholder}

  const showPostIt = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setPostIts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setPostIts(prev => prev.filter(p => p.id !== id));
    }, duration);
  }, []);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const prompt = useCallback((message, placeholder = '') => {
    return new Promise((resolve) => {
      setPromptState({ message, placeholder, resolve });
    });
  }, []);

  const handleConfirmAnswer = (answer) => {
    if (confirmState && typeof confirmState.resolve === 'function') confirmState.resolve(answer);
    setConfirmState(null);
  };

  const handlePromptAnswer = (value) => {
    if (promptState && typeof promptState.resolve === 'function') promptState.resolve(value);
    setPromptState(null);
  };

  return (
    <UiContext.Provider value={{ showPostIt, confirm, prompt }}>
      {children}

      {/* PostIts container */}
      <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {postIts.map(p => (
          <div key={p.id} style={{ minWidth: 200, maxWidth: 320, padding: '10px 14px', borderRadius: 8, color: '#fff', boxShadow: '0 4px 18px rgba(0,0,0,0.12)', background: p.type === 'success' ? '#2e7d32' : p.type === 'error' ? '#c62828' : '#37474f' }}>
            {p.message}
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmState && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: '90%', maxWidth: 420, color: '#023047' }}>
            <p style={{ marginBottom: 18 }}>{confirmState.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => handleConfirmAnswer(false)} style={{ padding: '8px 12px', background: '#ddd', border: 'none', borderRadius: 6 }}>Cancelar</button>
              <button onClick={() => handleConfirmAnswer(true)} style={{ padding: '8px 12px', background: '#023047', color: '#fff', border: 'none', borderRadius: 6 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptState && (
        <PromptModal state={promptState} onAnswer={handlePromptAnswer} />
      )}
    </UiContext.Provider>
  );
};

const PromptModal = ({ state, onAnswer }) => {
  const [val, setVal] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: '90%', maxWidth: 520, color: '#023047' }}>
        <p style={{ marginBottom: 8 }}>{state.message}</p>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={state.placeholder || ''} style={{ width: '100%', padding: '8px 10px', marginBottom: 12, borderRadius: 6, border: '1px solid #ccc' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => onAnswer(null)} style={{ padding: '8px 12px', background: '#ddd', border: 'none', borderRadius: 6 }}>Cancelar</button>
          <button onClick={() => onAnswer(val)} style={{ padding: '8px 12px', background: '#023047', color: '#fff', border: 'none', borderRadius: 6 }}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
};
