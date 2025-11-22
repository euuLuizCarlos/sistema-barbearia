import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ShowPasswordToggle from '../components/ShowPasswordToggle';
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t = query.get('token') || '';
    const e = query.get('email') || '';
    setToken(t);
    setEmail(e);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (String(newPassword).length < 8) return setStatus({ type: 'error', message: 'Senha deve ter no mínimo 8 caracteres.' });
    if (newPassword !== confirm) return setStatus({ type: 'error', message: 'Confirmação não confere.' });
    setLoading(true);
    try {
      const resp = await api.post('/auth/reset-password', { token, email, newPassword });
      setStatus({ type: 'success', message: resp?.data?.message || 'Senha alterada.' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Erro ao resetar senha.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#023047',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        maxWidth: '550px',
        width: '100%',
        boxSizing: 'border-box',
        color: '#fff'
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <img
            src={barberLogo}
            alt="BarberApp Logo"
            style={{ width: '90%', height: 'auto', margin: '0 0 15px 0' }}
          />
          <h2 style={{ margin: 0, fontSize: '1.5em', color: '#FFB703' }}>Redefinir senha</h2>
          <p style={{ margin: '5px 0 30px 0', fontSize: '0.9em', color: '#ccc' }}>Defina sua nova senha abaixo.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
          />

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha"
              required
              style={{ width: '100%', padding: '12px 40px 12px 10px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
            />
            <ShowPasswordToggle show={showNew} onToggle={() => setShowNew(s => !s)} ariaLabel={showNew ? 'Ocultar senha' : 'Mostrar senha'} />
          </div>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar senha"
              required
              style={{ width: '100%', padding: '12px 40px 12px 10px', border: '1px solid #455a64', borderRadius: '5px', fontSize: '1em', backgroundColor: '#fff', color: '#333' }}
            />
            <ShowPasswordToggle show={showConfirm} onToggle={() => setShowConfirm(s => !s)} ariaLabel={showConfirm ? 'Ocultar senha' : 'Mostrar senha'} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc9000'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFB703'}
          >
            {loading ? 'Enviando...' : 'Redefinir senha'}
          </button>
        </form>

        {status && (
          <p style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '0.9em', color: status.type === 'success' ? '#90ee90' : '#ff9999' }}>
            {status.message}
          </p>
        )}

        <p style={{ marginTop: '30px', fontSize: '0.9em' }}>
          <a href="/login" style={{ color: '#FFB703', textDecoration: 'none', fontWeight: 'bold' }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
            Voltar ao login
          </a>
        </p>
      </div>
    </div>
  );
}
