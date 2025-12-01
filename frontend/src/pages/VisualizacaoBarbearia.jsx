// src/pages/VisualizacaoBarbearia.jsx (CÓDIGO FINAL E CORRIGIDO PARA ERRO DE ESCOPO DE COR)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { FaChevronLeft, FaStar, FaDollarSign, FaSearch, FaMapMarkerAlt, FaRuler, FaUser, FaComment, FaUserTie, FaCut, FaClock } from 'react-icons/fa';

const VisualizacaoBarbearia = () => {
    const { barbeiroId } = useParams(); 
    const navigate = useNavigate();

    // --- 🚨 CORREÇÃO: DEFINIÇÃO DE CORES MOVIDA PARA DENTRO DO COMPONENTE 🚨 ---
    const PRIMARY_COLOR = '#023047'; 
    const ACCENT_COLOR = '#FFB703';
    const secondaryColor = '#888888';
    const SUCCESS_COLOR = '#4CAF50';
    const ERROR_COLOR = '#cc0000';
    const MAX_WIDTH = '800px'; 
    // --------------------------------------------------------------------------

    // ESTADOS
    const [servicos, setServicos] = useState([]);
    const [barbeariaInfo, setBarbeariaInfo] = useState(null);
    const [avaliacoesDetalhe, setAvaliacoesDetalhe] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('servicos'); 
    const [searchServiceTerm, setSearchServiceTerm] = useState('');
    
    // --- ESTILOS PADRÕES (Funções agora usam as constantes definidas acima) ---
    const buttonStyle = { padding: '8px 15px', backgroundColor: PRIMARY_COLOR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
    const tabStyle = (tabName) => ({ 
        padding: '10px 15px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        borderBottom: `3px solid ${activeTab === tabName ? ACCENT_COLOR : 'transparent'}`,
        color: activeTab === tabName ? PRIMARY_COLOR : secondaryColor
    });


    // --- LÓGICA DE BUSCA DE DADOS INICIAIS (Mantida) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // 1. Busca detalhes da Barbearia
                const infoResponse = await api.get(`/barbearia/${barbeiroId}/detalhes`);
                const info = infoResponse.data; 
                setBarbeariaInfo(info);
                
                // 2. Busca serviços DESTE Barbeiro
                const servicesResponse = await api.get(`/servicos/barbeiro/${barbeiroId}`); 
                setServicos(servicesResponse.data);

                // 3. Busca os detalhes das avaliações (Comentários)
                const avaliacoesResponse = await api.get(`/avaliacoes/barbeiro/${barbeiroId}/detalhes`);
                setAvaliacoesDetalhe(avaliacoesResponse.data);


            } catch (err) {
                const status = err.response?.status;
                const message = err.response?.data?.error || err.message;
                
                console.error("ERRO CRÍTICO NA BUSCA DO AGENDAMENTOCLIENTE:", status, message); 
                setError("Erro ao carregar dados: " + message);
            } finally {
                setLoading(false);
            }
        };
        if (barbeiroId) {
            fetchInitialData();
        }
    }, [barbeiroId, navigate]);
    
    
    // Filtro local de serviços
    const filteredServices = servicos.filter(s => 
        s.nome.toLowerCase().includes(searchServiceTerm.toLowerCase())
    );


    if (loading || !barbeariaInfo) {
        return <h1 style={{ padding: '50px' }}>Carregando perfil da barbearia...</h1>;
    }
    if (error) {
        return <h1 style={{ padding: '50px', color: ERROR_COLOR }}>{error}</h1>;
    }
    
    const { 
        nome_barbearia, rua, bairro, localidade, uf, foto_url, 
        nome_barbeiro, media_avaliacao_barbeiro, telefone, 
        numero, complemento, cep
    } = barbeariaInfo;
    
    const notaMedia = parseFloat(media_avaliacao_barbeiro || '0.0').toFixed(1);
    const totalAvaliacoes = avaliacoesDetalhe?.totalAvaliacoes || 0;

    
    // --- FUNÇÕES DE FORMATAÇÃO (Necessárias para renderização) ---
    const formatCep = (value) => {
        if (!value) return 'Não informado';
        value = String(value).replace(/\D/g, '');
        if (value.length === 8) {
            return value.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        return value;
    };
    
    const formatPhone = (value) => {
        if (!value) return 'Não informado';
        const v = String(value).replace(/\D/g, '').substring(0,11);
        if (v.length === 11) return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        if (v.length === 10) return v.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        return value;
    };

    
    // --- TELAS DE CONTEÚDO (JSX) ---
    
    const RenderServicos = () => (
        <div style={{ padding: '20px 0' }}>
            {/* Barra de Pesquisa de Serviço */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <FaSearch style={{ position: 'absolute', left: '15px', top: '12px', color: secondaryColor }} />
                <input 
                    type="text" 
                    placeholder="Pesquisar serviço..." 
                    value={searchServiceTerm} 
                    onChange={(e) => setSearchServiceTerm(e.target.value)}
                    style={{ padding: '10px 10px 10px 40px', width: '100%', borderRadius: '10px', border: '1px solid #ccc' }}
                />
            </div>
            
            {filteredServices.length === 0 ? (
                <p>Nenhum serviço encontrado.</p>
            ) : (
                filteredServices.map(servico => (
                    <div key={servico.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {/* Detalhes do Serviço */}
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1em' }}>{servico.nome}</h4>
                                <p style={{ margin: '5px 0 0 0', color: SUCCESS_COLOR, fontWeight: 'bold' }}>
                                    <FaDollarSign size={12} style={{ marginRight: '5px' }} /> R$ {parseFloat(servico.preco).toFixed(2)}
                                </p>
                                <p style={{ margin: 0, color: secondaryColor, fontSize: '0.9em' }}>
                                    <FaClock size={12} style={{ marginRight: '5px' }} /> {servico.duracao_minutos} min
                                </p>
                            </div>
                        </div>

                        {/* Botão de Agendar (Ação Principal) */}
                        <button 
                            onClick={() => navigate(`/agendamento/${barbeiroId}/selecionar-horario/${servico.id}`)}
                            style={{ ...buttonStyle, backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR, fontWeight: 'bold' }}
                        >
                            Agendar
                        </button>
                    </div>
                ))
            )}
        </div>
    );
    
    const RenderDetalhes = () => (
        <div style={{ padding: '20px 0', color: PRIMARY_COLOR }}>
            
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Informações do Profissional</h3>
            <p>
                <span style={{ fontWeight: 'bold' }}>👤 Barbeiro Responsável:</span> {nome_barbeiro}
            </p>

            <h3 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Endereço da Barbearia</h3>
            
            <p>
                <span style={{ fontWeight: 'bold' }}>📍 Endereço:</span> {rua}, N° {numero}
                {complemento && ` (${complemento})`}
            </p>
            <p>
                <span style={{ fontWeight: 'bold' }}>Bairro:</span> {bairro}
            </p>
            <p>
                <span style={{ fontWeight: 'bold' }}>Cidade/Estado:</span> {localidade} - {uf}
            </p>
            <p>
                <span style={{ fontWeight: 'bold' }}>CEP:</span> {formatCep(cep)}
            </p>
            
            <h3 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Contato</h3>
            <p>
                <span style={{ fontWeight: 'bold' }}>📞 Telefone:</span> {formatPhone(telefone)}
            </p>
            <p style={{ color: secondaryColor, fontSize: '0.9em' }}>
                *Entre em contato para confirmar horários de funcionamento específicos, feriados e domingos.
            </p>
        </div>
    );

    const RenderAvaliacoes = () => {
        const comentarios = avaliacoesDetalhe?.comentarios || [];

        // Estilo para o círculo da foto do cliente
        const photoCircleStyle = {
            width: '40px', height: '40px', borderRadius: '50%', 
            backgroundColor: secondaryColor, color: 'white', // Cor de fundo neutra
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            fontSize: '0.8em', fontWeight: 'bold', marginRight: '10px', 
            overflow: 'hidden'
        };

        return (
            <div style={{ padding: '20px 0', color: PRIMARY_COLOR }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '5px', marginBottom: '20px' }}>
                    <FaStar style={{ color: ACCENT_COLOR }}/> Comentários de Clientes ({totalAvaliacoes} total)
                </h3>
                
                {totalAvaliacoes === 0 ? (
                    <p style={{ color: secondaryColor }}>Ainda não há avaliações para este profissional.</p>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {comentarios.map((c, index) => (
                            <div key={index} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#f9f9f9' }}>
                                
                                {/* 🚨 LINHA DA FOTO, NOME E ESTRELAS 🚨 */}
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                    
                                    {/* CÍRCULO DA FOTO/INICIAIS */}
                                    <div style={photoCircleStyle}>
                                        {c.foto_cliente_url ? (
                                            <img 
                                                src={c.foto_cliente_url} 
                                                alt={c.nome_cliente} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        ) : (
                                            // Fallback para Iniciais se a URL da foto for null
                                            (c.nome_cliente ? c.nome_cliente.substring(0, 2).toUpperCase() : 'CL')
                                        )}
                                    </div>

                                    {/* NOME E ESTRELAS */}
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                                {c.nome_cliente}
                                            </span>
                                            <div style={{ color: ACCENT_COLOR }}>
                                                {Array.from({ length: c.nota }, (_, i) => <FaStar key={i} size={14} />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: PRIMARY_COLOR }}>
                                    **Serviço:** {c.nome_servico || 'Não especificado'}
                                </p>
                                {c.observacao && (
                                    <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', color: secondaryColor }}>
                                        "{c.observacao}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };


    return (
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '0 0 20px 0', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            {/* Informações de Cabeçalho da Barbearia */}
            <div style={{ padding: '20px', backgroundColor: PRIMARY_COLOR, color: 'white', position: 'relative' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'absolute', top: '20px', left: '20px', fontSize: '1.5em' }}>
                    <FaChevronLeft />
                </button>
                <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid white', margin: '0 auto 10px auto', overflow: 'hidden' }}>
                           <img src={foto_url || 'https://placehold.co/100/FFB703/023047?text=LOGO'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <h1 style={{ margin: '0', fontSize: '1.8em' }}>{nome_barbearia}</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '1em', color: ACCENT_COLOR }}>
                        <FaStar size={12} /> {notaMedia} ({totalAvaliacoes})
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                        📍 {rua}, {bairro} - {localidade}/{uf}
                    </p>
                </div>
            </div>
            
            {/* Abas de Navegação */}
            <div style={{ display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid #eee', margin: '0 20px' }}>
                <div style={tabStyle('servicos')} onClick={() => setActiveTab('servicos')}>SERVIÇOS</div>
                <div style={tabStyle('detalhes')} onClick={() => setActiveTab('detalhes')}>DETALHES</div>
                <div style={tabStyle('avaliacoes')} onClick={() => setActiveTab('avaliacoes')}>
                    AVALIAÇÕES ({totalAvaliacoes})
                </div>
            </div>

            {/* Renderização do Conteúdo da Aba */}
            <div style={{ padding: '0 20px' }}>
                {activeTab === 'servicos' && <RenderServicos />}
                {activeTab === 'detalhes' && <RenderDetalhes />}
                {activeTab === 'avaliacoes' && <RenderAvaliacoes />}
            </div>

        </div>
    );
};

export default VisualizacaoBarbearia;