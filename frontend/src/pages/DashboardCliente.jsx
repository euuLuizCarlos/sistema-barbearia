// src/pages/DashboardCliente.jsx (CÓDIGO FINAL COM O QUADRO AZUL PREENCHIDO)

import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaSearch, FaBell, FaCalendarAlt, FaStar, FaMapMarkerAlt, FaSpinner, 
    FaMapMarkedAlt, FaCity, FaUserTie, FaCut, FaChevronRight 
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import { useAuth } from '../contexts/AuthContext'; 
import { useUi } from '../contexts/UiContext'; 
import ModalAvaliacaoBarbeiro from '../components/Auth/ModalAvaliacaoBarbeiro'; 

const DashboardCliente = () => {
    const { user } = useAuth(); 
    const ui = useUi();
    const navigate = useNavigate();
    
    // Estados para listas e busca
    const [barbearias, setBarbearias] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('nome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // NOVO ESTADO: Armazena o último agendamento
    const [lastAppointment, setLastAppointment] = useState(null); 
    
    // ESTADO: Armazena o agendamento pendente para o modal de avaliação
    const [agendamentoPendente, setAgendamentoPendente] = useState(null); 

    // --- ESTILOS PADRÕES ---
    const primaryColor = '#023047'; 
    const secondaryColor = '#888888';
    const accentColor = '#FFB703';
    const searchBarColor = '#F0F0F0';
    const MAX_WIDTH = '900px'; 
    
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

    // --- FUNÇÃO NOVO: BUSCA O ÚLTIMO AGENDAMENTO ---
    const fetchLastAppointment = useCallback(async () => {
        if (user?.userType !== 'cliente') return;
        
        try {
            // Chama o endpoint que você adicionou no backend
            const response = await api.get('/agendamentos/ultimo'); 
            setLastAppointment(response.data || null); 
        } catch (err) {
            console.error("ERRO ao buscar o último agendamento:", err);
            setLastAppointment(null);
        }
    }, [user?.userType]);


    // --- FUNÇÕES DE BUSCA NA API (Barbearias) ---
    const fetchBarbearias = useCallback(async (query = '') => {
        if (user && user.userType !== 'cliente') return;
        
        setLoading(true);
        setError(null);
        
        try {
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

    const handleAvaliacaoConcluida = () => {
        setAgendamentoPendente(null); 
        checkPendingReviews(); 
    };
    
    // Efeitos
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchBarbearias(searchTerm);
        }, 300);

        return () => clearTimeout(delaySearch); 
    }, [searchTerm, fetchBarbearias]); 
    
    useEffect(() => {
        checkPendingReviews();
        fetchLastAppointment(); 
    }, [checkPendingReviews, fetchLastAppointment]);
    

    // --- RENDERIZAÇÃO DO ÚLTIMO AGENDAMENTO (DENTRO DA CAIXA AZUL) ---
    const renderLastAppointment = () => {
        if (!lastAppointment || !lastAppointment.data_agendamento) {
            return (
                <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
                    Em Breve, Agendamentos aqui!
                </p>
            );
        }

        const dataAgendamento = new Date(lastAppointment.data_agendamento);
        // Formata a hora de início
        const horaFormatada = dataAgendamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return (
            <div style={{ paddingRight: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4em', color: accentColor, display: 'flex', alignItems: 'center' }}>
                    <FaCalendarAlt style={{ marginRight: '10px' }} /> 
                    {dataAgendamento.toLocaleDateString('pt-BR')} | {horaFormatada}
                </h3>
                <p style={{ margin: '5px 0', fontSize: '1.2em', fontWeight: 'bold' }}>
                    <FaCut style={{ marginRight: '8px' }} /> {lastAppointment.servico_nome || 'Serviço Não Definido'}
                </p>
                <p style={{ margin: '5px 0', fontSize: '1em' }}>
                    <FaUserTie style={{ marginRight: '8px' }} /> Barbeiro: {lastAppointment.nome_barbearia || 'Não Informado'}
                </p>
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                     <FaChevronRight size={24} color={accentColor} />
                </div>
            </div>
        );
    }
    
    
    return (
        <div style={{ 
            backgroundColor: '#FFFFFF', 
            minHeight: '100vh', 
            fontFamily: 'sans-serif' 
        }}>
            {/* 💡 CONTAINER CENTRALIZADO GERAL */}
            <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '0 20px' }}>
            
                {/* --- HEADER SUPERIOR --- */}
                <div style={{ paddingTop: '20px', color: primaryColor }}>
                    <h1 style={{ margin: '0', fontSize: '1.8em' }}>Olá, {user?.userName?.split(' ')[0] || 'Cliente'}</h1>
                    <p style={{ margin: '5px 0 15px 0', fontSize: '1em', color: secondaryColor }}>
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    
                    {/* 1. Barra de Busca */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flexGrow: 1, position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '15px', top: '12px', color: secondaryColor }} />
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
                        </div>
                        <FaBell size={24} color={primaryColor} style={{ marginLeft: '15px' }} />
                    </div>
                    
                    {/* 2. Botões de Filtro */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                        <button style={filterButtonStyle('nome')} onClick={() => setSearchType('nome')}><FaSearch size={14} /> Nome</button>
                        <button style={filterButtonStyle('cidade')} onClick={() => setSearchType('cidade')}><FaCity size={14} /> Cidade</button>
                        <button style={filterButtonStyle('proximas')} onClick={() => setSearchType('proximas')}><FaMapMarkedAlt size={14} /> Próximas</button>
                    </div>
                </div>

                {/* --- CAIXA AZUL: ÚLTIMO AGENDAMENTO/PLACEHOLDER --- */}
                <div 
                    style={{
                        padding: '20px', color: 'white', margin: '20px 0', borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', backgroundColor: primaryColor,
                        minHeight: '150px', display: 'flex', flexDirection: 'column',
                        justifyContent: 'center',
                        cursor: 'pointer', // Indicando que é clicável
                        position: 'relative', // Necessário para posicionar a seta
                    }}
                    onClick={() => navigate('/meus-agendamentos')} // Ação de Redirecionamento
                >
                    {renderLastAppointment()}
                </div>

                {/* --- RESULTADOS DA BUSCA --- */}
                <div style={{ paddingBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5em', borderBottom: '2px solid #EEEEEE', paddingBottom: '10px' }}>
                        Barbearias Encontradas
                    </h2>
                    
                    {barbearias.length === 0 && !loading && !error && searchTerm ? (
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
                                                {parseFloat(barbearia.media_avaliacao_barbeiro).toFixed(1)} | {barbearia.localidade} - {barbearia.uf} 
                                            </p>
                                            {/* Distância */}
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
            </div> {/* Fim do Container Centralizado */}

            {/* 🚨 RENDERIZAÇÃO CONDICIONAL DO MODAL DE AVALIAÇÃO 🚨 */}
            {agendamentoPendente && (
                <ModalAvaliacaoBarbeiro 
                    agendamento={agendamentoPendente}
                    onAvaliacaoConcluida={handleAvaliacaoConcluida}
                />
            )}
            
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default DashboardCliente;