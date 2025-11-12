import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaCalendarAlt, FaCut, FaClock, FaChevronLeft, FaStar, FaDollarSign, FaSearch, FaMapMarkerAlt, FaRuler } from 'react-icons/fa';

// Componente para a Página de Agendamento do Cliente
const AgendamentoCliente = () => {
    // ID do barbeiro/barbearia vindo da URL (ex: /agendamento/1)
    const { barbeiroId } = useParams(); 
    const navigate = useNavigate();
    // const { user } = useAuth(); // Descomente se for usar o ID do cliente

    // Estados
    const [servicos, setServicos] = useState([]);
    const [barbeariaInfo, setBarbeariaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('servicos'); // 'servicos', 'detalhes', 'profissionais'
    const [searchServiceTerm, setSearchServiceTerm] = useState('');
    
    // --- LÓGICA DE BUSCA DE DADOS INICIAIS ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // 1. Busca informações da Barbearia (Usando a rota de busca)
                const infoResponse = await api.get(`/barbearias/busca?query=${barbeiroId}`);
                
                // Encontra a barbearia pelo ID
                const info = infoResponse.data.find(b => b.barbeiro_id === parseInt(barbeiroId));
                
                if(!info) {
                    setError("Barbearia não encontrada ou inativa.");
                    setLoading(false);
                    return;
                }
                setBarbeariaInfo(info);
                
                // 2. Busca serviços DESTE Barbeiro (ROTA PENDENTE no Node.js)
                // Se a rota ainda não estiver implementada, causará um erro 404
                const servicesResponse = await api.get(`/servicos/barbeiro/${barbeiroId}`); 
                setServicos(servicesResponse.data);

            } catch (err) {
                 const status = err.response?.status;
                if (status === 404) {
                    setError("Erro 404: Rota de serviços do barbeiro não implementada no Node.js.");
                } else {
                     setError("Erro ao carregar dados iniciais. Verifique a API.");
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [barbeiroId]);
    
    // Filtro local de serviços
    const filteredServices = servicos.filter(s => 
        s.nome.toLowerCase().includes(searchServiceTerm.toLowerCase())
    );


    if (loading) {
        return <h1 style={{ padding: '20px' }}>Carregando perfil da barbearia...</h1>;
    }
    
    if (error) {
        return <h1 style={{ padding: '20px', color: 'red' }}>{error}</h1>;
    }
    
    const { nome_barbearia, rua, bairro, localidade, uf, foto_url, nome_barbeiro } = barbeariaInfo;
    
    // --- ESTILOS ---
    const primaryColor = '#023047';
    const accentColor = '#FFB703';
    const secondaryColor = '#888888';
    const buttonStyle = { padding: '8px 15px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
    const tabStyle = (tabName) => ({ 
        padding: '10px 15px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        borderBottom: `3px solid ${activeTab === tabName ? accentColor : 'transparent'}`,
        color: activeTab === tabName ? primaryColor : secondaryColor
    });


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
                        
                        {/* Imagem/Ícone do Serviço (Simulado) */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#eee', marginRight: '15px', overflow: 'hidden' }}>
                                <FaCut size={24} style={{ margin: '13px', color: secondaryColor }} />
                            </div>
                            
                            {/* Detalhes do Serviço */}
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1em' }}>{servico.nome}</h4>
                                <p style={{ margin: '5px 0 0 0', color: '#4CAF50', fontWeight: 'bold' }}>
                                    <FaDollarSign size={12} style={{ marginRight: '5px' }} /> R$ {parseFloat(servico.preco).toFixed(2)}
                                </p>
                                <p style={{ margin: 0, color: secondaryColor, fontSize: '0.9em' }}>
                                    <FaClock size={12} style={{ marginRight: '5px' }} /> {servico.duracao_minutos} min
                                </p>
                            </div>
                        </div>

                        {/* Botão de Agendar (Ação Principal) */}
                        <button 
                            // Navega para a tela de seleção de horário, passando o ID do serviço
                            onClick={() => navigate(`/agendamento/${barbeiroId}/selecionar-horario/${servico.id}`)}
                            style={{ ...buttonStyle, backgroundColor: accentColor, color: primaryColor, fontWeight: 'bold' }}
                        >
                            Agendar
                        </button>
                    </div>
                ))
            )}
        </div>
    );
    
    // Simulação da Tela de Detalhes
    const RenderDetalhes = () => (
        <div style={{ padding: '20px 0', color: primaryColor }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Endereço e Contato</h3>
            <p>📍 {rua}, {localidade} - {uf}</p>
            <p>Telefone: {barbeariaInfo.telefone || '(00) 99999-9999'} (Simulado)</p>
            
            <h3 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Horário Padrão</h3>
            <p>Os horários de atendimento variam diariamente e por profissional.</p>
            <p style={{ color: secondaryColor, fontSize: '0.9em' }}>Selecione um serviço e clique em Agendar para ver a disponibilidade em tempo real.</p>
        </div>
    );
    
    // Simulação da Tela de Profissionais
    const RenderProfissionais = () => (
        <div style={{ padding: '20px 0', color: primaryColor }}>
            <h3>Profissionais Disponíveis</h3>
            <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                <p><strong>{nome_barbeiro}</strong> (Barbeiro Principal / Gestor)</p>
                <p style={{ color: secondaryColor, fontSize: '0.9em' }}>O agendamento é feito com a barbearia; os horários refletem a disponibilidade geral.</p>
            </div>
        </div>
    );


    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 0 20px 0', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            {/* Informações de Cabeçalho da Barbearia (Baseado na imagem) */}
            <div style={{ padding: '20px', backgroundColor: primaryColor, color: 'white', position: 'relative' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'absolute', top: '20px', left: '20px', fontSize: '1.5em' }}>
                    <FaChevronLeft />
                </button>
                <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                    
                    {/* Logo/Foto da Barbearia */}
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid white', margin: '0 auto 10px auto', overflow: 'hidden' }}>
                         <img src={foto_url || 'https://placehold.co/100/FFB703/023047?text=LOGO'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <h1 style={{ margin: '0', fontSize: '1.8em' }}>{nome_barbearia}</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '1em', color: accentColor }}>
                         <FaStar size={12} /> 5.0
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
                <div style={tabStyle('profissionais')} onClick={() => setActiveTab('profissionais')}>PROFISSIONAIS</div>
            </div>

            {/* Renderização do Conteúdo da Aba */}
            <div style={{ padding: '0 20px' }}>
                {activeTab === 'servicos' && <RenderServicos />}
                {activeTab === 'detalhes' && <RenderDetalhes />}
                {activeTab === 'profissionais' && <RenderProfissionais />}
            </div>

        </div>
    );
};

export default AgendamentoCliente;