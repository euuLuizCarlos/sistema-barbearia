// src/pages/DashboardCliente.jsx (CÓDIGO FINAL E COMPLETO)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FaSearch, FaBell, FaCalendarAlt, FaStar, FaMapMarkerAlt, FaSpinner, 
    FaMapMarkedAlt, FaCity, FaUserTie, FaCut, FaChevronRight, FaGlobeAmericas, FaTimes
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
    
    // --- ESTILOS/CONSTANTES DE COR (Definidos no escopo principal) ---
    const primaryColor = '#023047'; 
    const secondaryColor = '#888888';
    const accentColor = '#FFB703';
    const searchBarColor = '#F0F0F0';
    const ERROR_COLOR = '#cc0000'; // 🚨 CORREÇÃO: Constante de cor definida 🚨
    const MAX_WIDTH = '900px'; 
    const MOCK_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']; 

    // --- ESTADOS CRÍTICOS ---
    const [barbearias, setBarbearias] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('nome'); 
    const [selectedState, setSelectedState] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [lastAppointment, setLastAppointment] = useState(null); 
    const [agendamentoPendente, setAgendamentoPendente] = useState(null); 

    // 🚨 ESTILO CORRIGIDO: Usa activeFilter
    const filterButtonStyle = (type) => ({
        padding: '8px 15px',
        borderRadius: '20px',
        border: `2px solid ${activeFilter === type ? primaryColor : secondaryColor}`,
        backgroundColor: activeFilter === type ? accentColor : '#fff',
        color: activeFilter === type ? primaryColor : secondaryColor,
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9em',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    });

    // --- FUNÇÃO: BUSCA O ÚLTIMO AGENDAMENTO ---
    const fetchLastAppointment = useCallback(async () => {
        if (user?.userType !== 'cliente') return;
        
        try {
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
            // Usa activeFilter no endpoint
            const endpoint = `/barbearias/busca?query=${query}&type=${activeFilter}`; 
            const response = await api.get(endpoint);
            setBarbearias(response.data);
        } catch (err) {
            console.error("ERRO na Busca de Barbearias:", err.response?.status, err.message); 
            setError("Erro ao carregar barbearias. Verifique a API.");
            setBarbearias([]);
        } finally {
            setLoading(false);
        }
    }, [user, activeFilter]); // Dependência de activeFilter


    // --- FUNÇÃO CRÍTICA: CHECA AVALIAÇÕES PENDENTES 🚨
    const checkPendingReviews = useCallback(async () => {
        if (user?.userType !== 'cliente') return;
        try {
            const response = await api.get('/avaliacoes/pendentes');
            setAgendamentoPendente(response.data.pending ? response.data.agendamento : null);
        } catch (err) {
            console.error("Falha ao checar pendências de avaliação:", err);
            setAgendamentoPendente(null);
        }
    }, [user?.userType]);

    const handleAvaliacaoConcluida = () => { 
        setAgendamentoPendente(null); 
        checkPendingReviews(); 
    };
    
    // Efeitos de ciclo de vida (Busca e Avaliação)
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchBarbearias(searchTerm);
        }, 300);
        return () => clearTimeout(delaySearch); 
    }, [searchTerm, fetchBarbearias, activeFilter]); 
    
    useEffect(() => {
        checkPendingReviews();
        fetchLastAppointment(); 
    }, [checkPendingReviews, fetchLastAppointment]);
    

    // --- LÓGICA DE FILTRAGEM E ORDENAÇÃO ---
    const filteredAndSortedBarbearias = useMemo(() => {
        let lista = [...barbearias];
        
        if (searchTerm) {
             const term = searchTerm.toLowerCase();
             lista = lista.filter(b => {
                 const searchField = activeFilter === 'nome' ? b.nome : b.localidade;
                 return searchField && searchField.toLowerCase().includes(term);
             });
         }
         
         if (activeFilter === 'cidade' && selectedState) {
             const state = selectedState.toUpperCase();
             lista = lista.filter(b => b.uf === state);
         }

         if (activeFilter === 'cidade') {
             lista.sort((a, b) => (a.localidade || '').toLowerCase().localeCompare((b.localidade || '').toLowerCase()));
         } else {
              lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
         }
         return lista;
    }, [barbearias, searchTerm, activeFilter, selectedState]);


    const handleFilterButtonClick = (filterType) => {
        setActiveFilter(filterType);
        setSelectedState('');
        setSearchTerm('');
    };
    
    const handleStateChange = (e) => {
        setSelectedState(e.target.value);
    };

    // --- RENDERIZAÇÃO DO ÚLTIMO AGENDAMENTO (DENTRO DA CAIXA AZUL) ---
    const renderLastAppointment = () => {
        if (lastAppointment === undefined || loading) {
             return <FaSpinner size={24} color={accentColor} className="spinner" />;
        }
        
        if (lastAppointment === null || !lastAppointment.data_agendamento) {
            return (
                <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
                    Em Breve, Agendamentos aqui!
                </p>
            );
        }

        const dataAgendamento = new Date(lastAppointment.data_agendamento);
        const horaFormatada = dataAgendamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let titleText = lastAppointment.status === 'concluido' ? "Último Agendamento" : "Próximo Agendamento";
        let statusMessage = lastAppointment.status === 'concluido' ? "Concluído com Sucesso!" : "";
        let messageColor = lastAppointment.status === 'concluido' ? '#66bb6a' : 'white'; 
        
        return (
            <div style={{ paddingRight: '20px' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4em', color: accentColor }}>
                    {titleText}
                </h2>
                
                {statusMessage && (
                    <p style={{ margin: '0 0 10px 0', fontSize: '1em', fontWeight: 'bold', color: messageColor }}>
                        {statusMessage}
                    </p>
                )}
                
                <p style={{ margin: '5px 0', fontSize: '1.1em', fontWeight: 'bold' }}>
                    <FaCalendarAlt style={{ marginRight: '8px' }} /> 
                    {dataAgendamento.toLocaleDateString('pt-BR')} | {horaFormatada}
                </p>
                <p style={{ margin: '5px 0', fontSize: '1.1em', fontWeight: 'bold' }}>
                    <FaCut style={{ marginRight: '8px' }} /> {lastAppointment.servico_nome || 'Serviço Não Definido'}
                </p>
                <p style={{ margin: '5px 0', fontSize: '1em' }}>
                    <FaUserTie style={{ marginRight: '8px' }} /> Barbearia: {lastAppointment.nome_barbearia || 'Não Informado'}
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
                                placeholder={activeFilter === 'nome' ? "Buscar Barbearia por Nome" : "Buscar Barbearia por Cidade/Estado"}
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
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
                        <button style={filterButtonStyle('nome')} onClick={() => handleFilterButtonClick('nome')}><FaSearch size={14} /> Nome</button>
                        <button style={filterButtonStyle('cidade')} onClick={() => handleFilterButtonClick('cidade')}><FaCity size={14} /> Cidade</button>
                    </div>
                </div>

                {/* NOVO: DROPDOWN DE ESTADO (UF) QUANDO FILTRO CIDADE ESTIVER ATIVO */}
                {activeFilter === 'cidade' && (
                    <div style={{ padding: '10px 0', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: primaryColor, fontSize: '14px' }}>
                            <FaGlobeAmericas style={{ marginRight: '5px' }} /> Filtrar por Estado (UF):
                        </label>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            style={{ width: '200px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">Todos os Estados</option>
                            {MOCK_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        {selectedState && (
                            <button 
                                onClick={() => setSelectedState('')}
                                style={{ marginLeft: '10px', padding: '10px 15px', border: 'none', borderRadius: '4px', backgroundColor: ERROR_COLOR, color: 'white', cursor: 'pointer' }}
                            >
                                <FaTimes /> Limpar
                            </button>
                        )}
                    </div>
                )}


                {/* --- CAIXA AZUL: ÚLTIMO AGENDAMENTO/PLACEHOLDER (CLICÁVEL) --- */}
                <div 
                    style={{
                        padding: '20px', color: 'white', margin: '20px 0', borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', backgroundColor: primaryColor,
                        minHeight: '150px', display: 'flex', flexDirection: 'column',
                        justifyContent: 'center',
                        cursor: 'pointer', 
                        position: 'relative', 
                    }}
                    onClick={() => navigate('/meus-agendamentos')} 
                >
                    {renderLastAppointment()}
                </div>

                {/* --- RESULTADOS DA BUSCA --- */}
                <div style={{ paddingBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5em', borderBottom: '2px solid #EEEEEE', paddingBottom: '10px' }}>
                        Barbearias Encontradas
                    </h2>
                    
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <FaSpinner size={30} color={primaryColor} className="spinner" />
                            <p>Buscando barbearias...</p>
                        </div>
                    )}
                    
                    {barbearias.length === 0 && !loading && !error && searchTerm ? (
                        <p>Nenhuma barbearia encontrada com a busca atual.</p>
                    ) : (
                        <div>
                            {filteredAndSortedBarbearias.map(barbearia => (
                                <Link 
                                    to={`/barbearia/${barbearia.barbeiro_id}`} 
                                    key={barbearia.barbeiro_id} 
                                    style={{ textDecoration: 'none', color: primaryColor }}
                                >
                                    <div style={{ padding: '15px 0', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center' }}>
                                        
                                        {/* Ícone/Foto da Barbearia */}
                                        <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '50%', backgroundColor: primaryColor, color: accentColor, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8em', fontWeight: 'bold', marginRight: '15px', overflow: 'hidden' }}>
    {/* Verifica se a foto_url foi retornada pelo backend */}
    {barbearia.foto_url ? (
        <img 
            src={barbearia.foto_url} 
            alt={`Logo de ${barbearia.nome_barbearia || barbearia.nome}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
    ) : (
        // Fallback: Exibe as iniciais (ex: "ba" para barbara)
        (barbearia.nome_barbearia || barbearia.nome || 'B').substring(0, 2)
    )}
</div>
                                        <div style={{ flexGrow: 1 }}>
                                            {/* Título e Estrelas */}
                                            <h3 style={{ margin: '0', fontSize: '1.2em' }}>{barbearia.nome_barbearia || barbearia.nome}</h3>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: secondaryColor }}>
                                                <FaStar size={12} color={accentColor} style={{ marginRight: '5px' }} /> 
                                                {parseFloat(barbearia.media_avaliacao_barbeiro || 0.0).toFixed(1)} | {barbearia.localidade} - {barbearia.uf} 
                                            </p>
                                            
                                            {/* ENDEREÇO COMPLETO (Rua, Número e Bairro/Cidade) */}
                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: secondaryColor }}>
                                                <FaMapMarkerAlt size={12} color={secondaryColor} style={{ marginRight: '5px' }} /> 
                                                
                                                {/* Concatenação da Rua/Localidade, Número e Bairro */}
                                                {`${barbearia.rua || barbearia.localidade}` + 
                                                 (barbearia.numero ? `, N° ${barbearia.numero}` : '') + 
                                                 (barbearia.bairro ? ` - ${barbearia.bairro}` : '')}
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