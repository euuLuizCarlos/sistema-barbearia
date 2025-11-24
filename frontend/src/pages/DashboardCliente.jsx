// src/pages/DashboardCliente.jsx (COMPLETO E ATUALIZADO)

import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaBell, FaHome, FaAlignJustify, FaCalendarAlt, FaStar, FaMapMarkerAlt, FaSpinner, FaMapMarkedAlt, FaCity, FaUserTie } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../services/api'; 
import { useAuth } from '../contexts/AuthContext'; 
import { useUi } from '../contexts/UiContext'; 
import ModalAvaliacaoBarbeiro from '../components/Auth/ModalAvaliacaoBarbeiro'; 

const DashboardCliente = () => {
    const { user } = useAuth(); 
    const ui = useUi();
    
    // Estados para listas e busca
    const [barbearias, setBarbearias] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('nome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // NOVO ESTADO: Armazena o agendamento pendente para o modal
    const [agendamentoPendente, setAgendamentoPendente] = useState(null); 

    // --- ESTILOS PADRÕES ---
    const primaryColor = '#023047'; 
    const secondaryColor = '#888888';
    const accentColor = '#FFB703';
    const searchBarColor = '#F0F0F0';
    
    const filterButtonStyle = (type) => ({
        padding: '8px 15px',
        borderRadius: '20px',
        border: `2px solid ${searchType === type ? primaryColor : secondaryColor}`,
        backgroundColor: searchType === type ? accentColor : '#fff',
        color: searchType === type ? primaryColor : secondaryColor,
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9em',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    });

    // --- FUNÇÕES DE BUSCA NA API (Barbearias) ---
    const fetchBarbearias = useCallback(async (query = '') => {
        if (user && user.userType !== 'cliente') return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Rota GET /barbearias/busca (agora retorna media_avaliacao_barbeiro)
            const response = await api.get(`/barbearias/busca?query=${query}`);
            setBarbearias(response.data);
            
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.error || err.message;
            
            console.error("ERRO na Busca de Barbearias:", status, message); 
            setError("Erro ao carregar barbearias. Verifique a API.");
            setBarbearias([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // --- FUNÇÃO CRÍTICA: CHECA AVALIAÇÕES PENDENTES (Cliente avalia Barbeiro) 🚨
    const checkPendingReviews = useCallback(async () => {
        if (user?.userType === 'cliente') {
            try {
                const response = await api.get('/avaliacoes/pendentes');
                if (response.data.pending) {
                    setAgendamentoPendente(response.data.agendamento);
                } else {
                    setAgendamentoPendente(null);
                }
            } catch (err) {
                console.error("Falha ao checar pendências de avaliação:", err);
            }
        }
    }, [user?.userType]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchBarbearias(searchTerm);
        }, 300);

        return () => clearTimeout(delaySearch); 
    }, [searchTerm, fetchBarbearias]); 
    
    useEffect(() => {
        checkPendingReviews();
    }, [checkPendingReviews]);
    
    const handleAvaliacaoConcluida = () => {
        setAgendamentoPendente(null); 
        checkPendingReviews(); 
    };
    

    // --- RENDERIZAÇÃO ---
    if (loading) {
        return <h1 style={{ padding: '20px', textAlign: 'center', color: primaryColor }}><FaSpinner className="spinner" /> Carregando perfil da barbearia...</h1>;
    }
    
    if (error) {
        return <h1 style={{ padding: '20px', color: 'red' }}>{error}</h1>;
    }
    
    const userName = user?.userName || 'Cliente';


    return (
        <div style={{ padding: '0', backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            
            {/* --- HEADER SUPERIOR --- */}
            <div style={{ padding: '20px 20px 0 20px', color: primaryColor }}>
                <h1 style={{ margin: '0', fontSize: '1.8em' }}>Olá, {userName.split(' ')[0]}</h1>
                <p style={{ margin: '5px 0 15px 0', fontSize: '1em', color: secondaryColor }}>
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                
                {/* 1. Barra de Busca */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flexGrow: 1, position: 'relative' }}>
                        {/* ... (Lógica de Spinner/Search Icon) ... */}
                        <input 
                            type="text" 
                            placeholder="Buscar Barbearia" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={{ 
                                width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', 
                                border: 'none', backgroundColor: searchBarColor, fontSize: '1em'
                            }} 
                        />
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                    <FaBell size={24} color={primaryColor} style={{ marginLeft: '15px' }} />
                </div>
                
                {/* 2. Botões de Filtro */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {/* ... (Botões de Filtro, mantidos) ... */}
                </div>
            </div>

            {/* --- CAROUSEL (Próximos Agendamentos do Cliente - Opcional) --- */}
            <div style={{ padding: '20px', color: 'white', margin: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', backgroundColor: primaryColor, minHeight: '200px', display: 'flex', alignItems: 'flex-end' }}>
                <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
                    Em Breve, Agendamentos aqui!
                </p>
            </div>

            {/* --- RESULTADOS DA BUSCA --- */}
            <div style={{ padding: '0 20px' }}>
                <h2 style={{ fontSize: '1.5em', borderBottom: '2px solid #EEEEEE', paddingBottom: '10px' }}>
                    Barbearias Encontradas
                </h2>
                
                {barbearias.length === 0 && !loading && !error ? (
                    <p>Nenhuma barbearia encontrada com a busca atual.</p>
                ) : (
                    <div>
                        {barbearias.map(barbearia => (
                            <Link 
                                to={`/barbearia/${barbearia.barbeiro_id}`} 
                                key={barbearia.barbeiro_id} 
                                style={{ textDecoration: 'none', color: primaryColor }}
                            >
                                <div style={{ padding: '15px 0', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center' }}>
                                    
                                    {/* Ícone/Foto da Barbearia */}
                                    <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '50%', backgroundColor: primaryColor, color: accentColor, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8em', fontWeight: 'bold', marginRight: '15px', overflow: 'hidden' }}>
                                        {barbearia.foto_url ? (
                                            <img src={barbearia.foto_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            barbearia.nome_barbearia.substring(0, 2)
                                        )}
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        {/* Título e Estrelas */}
                                        <h3 style={{ margin: '0', fontSize: '1.2em' }}>{barbearia.nome_barbearia}</h3>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: secondaryColor }}>
                                            <FaStar size={12} color={accentColor} style={{ marginRight: '5px' }} /> 
                                            {/* 🚨 REPUTAÇÃO REAL DO BARBEIRO 🚨 */}
                                            {parseFloat(barbearia.media_avaliacao_barbeiro).toFixed(1)} | {barbearia.localidade} - {barbearia.uf} 
                                        </p>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: secondaryColor }}>
                                            <FaMapMarkerAlt size={12} color={secondaryColor} style={{ marginRight: '5px' }} /> 
                                            0.5 km (Simulado)
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* 🚨 RENDERIZAÇÃO CONDICIONAL DO MODAL DE AVALIAÇÃO 🚨 */}
            {agendamentoPendente && (
                <ModalAvaliacaoBarbeiro 
                    agendamento={agendamentoPendente}
                    onAvaliacaoConcluida={handleAvaliacaoConcluida}
                />
            )}
            
        </div>
    );
};

export default DashboardCliente;