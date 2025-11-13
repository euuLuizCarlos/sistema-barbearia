// src/pages/VisualizacaoBarbearia.jsx (Substitui a lógica principal do AgendamentoCliente)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaChevronLeft, FaCut, FaDollarSign, FaClock, FaSearch, FaStar, FaMapMarkerAlt, FaCity } from 'react-icons/fa';

// Novo nome para o componente
const VisualizacaoBarbearia = () => { 
    // ID do barbeiro/barbearia vindo da URL (AGORA: /barbearia/1)
    const { barbeiroId } = useParams(); 
    const navigate = useNavigate();
    
    // ESTADOS
    const [servicos, setServicos] = useState([]);
    const [barbeariaInfo, setBarbeariaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('servicos'); 
    const [searchServiceTerm, setSearchServiceTerm] = useState('');
    
    // --- LÓGICA DE BUSCA DE DADOS INICIAIS ---
    useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Busca informações da Barbearia (USANDO A NOVA ROTA POR ID)
            const infoResponse = await api.get(`/barbearia/${barbeiroId}/detalhes`);
            
            // O Backend já retorna o objeto direto ou 404 se não encontrar
            const info = infoResponse.data; 
            setBarbeariaInfo(info);
            
            // 2. Busca serviços DESTE Barbeiro (ROTA EXISTENTE)
            const servicesResponse = await api.get(`/servicos/barbeiro/${barbeiroId}`); 
            setServicos(servicesResponse.data);

        } catch (err) {
            // ... (Bloco de tratamento de erro)
            const status = err.response?.status;
            const message = err.response?.data?.error || err.message;
            
            if (status === 404) {
                 setError(`Barbearia ID ${barbeiroId} não encontrada. Redirecionando...`);
            } else {
                 setError(`Erro na API (Status: ${status}). Redirecionando...`);
            }
            
            setTimeout(() => navigate('/'), 3000); 

        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
}, [barbeiroId, navigate]);
    
    // Filtro local de serviços
    const filteredServices = servicos.filter(s => 
        s.nome.toLowerCase().includes(searchServiceTerm.toLowerCase())
    );


    // ... (ESTILOS E FUNÇÕES DE RENDERIZAÇÃO RenderServicos, RenderDetalhes, RenderProfissionais)
    // COLOQUE O CÓDIGO DAQUELES COMPONENTES AQUI
    // ...
    
    // SEÇÃO DE RENDERIZAÇÃO PRINCIPAL (CABEÇALHO + ABAS)
    if (loading) {
        return <h1 style={{ padding: '20px' }}>Carregando perfil e serviços...</h1>;
    }
    
    if (error && !loading) {
        return <h1 style={{ padding: '20px', color: 'red' }}>{error}</h1>;
    }

    // Se barbeariaInfo for null (apesar do tratamento de erro), evita quebrar
    if (!barbeariaInfo) {
        return <h1 style={{ padding: '20px', color: 'red' }}>Barbearia não carregada.</h1>;
    }


    const { nome_barbearia, rua, bairro, localidade, uf, foto_url, nome_barbeiro } = barbeariaInfo;
    // ... (Resto dos estilos que você usou no AgendamentoCliente) ...

    
    // COLOQUE AS FUNÇÕES RENDERIZADORAS (RenderServicos, RenderDetalhes, RenderProfissionais) AQUI!
    // Para simplificar, vou incluir apenas o JSX final abaixo:
    
    
    const RenderServicos = () => (
        <div style={{ padding: '20px 0' }}>
            {/* ... (CÓDIGO DA BARRA DE PESQUISA) ... */}
            
            {filteredServices.length === 0 ? (
                <p>Nenhum serviço encontrado.</p>
            ) : (
                filteredServices.map(servico => (
                    <div key={servico.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#eee', marginRight: '15px', overflow: 'hidden' }}>
                                <FaCut size={24} style={{ margin: '13px', color: '#888888' }} />
                            </div>
                            
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1em' }}>{servico.nome}</h4>
                                <p style={{ margin: '5px 0 0 0', color: '#4CAF50', fontWeight: 'bold' }}>
                                    <FaDollarSign size={12} style={{ marginRight: '5px' }} /> R$ {parseFloat(servico.preco).toFixed(2)}
                                </p>
                                <p style={{ margin: 0, color: '#888888', fontSize: '0.9em' }}>
                                    <FaClock size={12} style={{ marginRight: '5px' }} /> {servico.duracao_minutos} min
                                </p>
                            </div>
                        </div>

                        <button 
                            // Navega para a próxima tela de seleção de horário/profissional
                            onClick={() => navigate(`/agendamento/${barbeiroId}/selecionar-horario/${servico.id}`)}
                            style={{ padding: '8px 15px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Agendar
                        </button>
                    </div>
                ))
            )}
        </div>
    );
    
    const RenderDetalhes = () => (
        <div style={{ padding: '20px 0', color: '#023047' }}>
            {/* ... (CÓDIGO DOS DETALHES) ... */}
            <h3>Endereço e Contato</h3>
            <p>📍 {rua}, {localidade} - {uf}</p>
        </div>
    );

    const RenderProfissionais = () => (
        <div style={{ padding: '20px 0', color: '#023047' }}>
             {/* ... (CÓDIGO DOS PROFISSIONAIS) ... */}
            <h3>Profissionais Disponíveis</h3>
            <p><strong>{nome_barbeiro}</strong> (Barbeiro Principal / Gestor)</p>
        </div>
    );
    

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 0 20px 0', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            {/* CABEÇALHO (Como na sua imagem) */}
            <div style={{ padding: '20px', backgroundColor: '#023047', color: 'white', position: 'relative' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'absolute', top: '20px', left: '20px', fontSize: '1.5em' }}>
                    <FaChevronLeft />
                </button>
                <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid white', margin: '0 auto 10px auto', overflow: 'hidden' }}>
                        <img src={foto_url || 'https://placehold.co/100/FFB703/023047?text=LOGO'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{ margin: '0', fontSize: '1.8em' }}>{nome_barbearia}</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '1em', color: '#FFB703' }}>
                        <FaStar size={12} /> 5.0
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                        📍 {rua}, {bairro} - {localidade}/{uf}
                    </p>
                </div>
            </div>
            
            {/* ABAS */}
            <div style={{ display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid #eee', margin: '0 20px' }}>
                <div style={{ padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold', borderBottom: `3px solid ${activeTab === 'servicos' ? '#FFB703' : 'transparent'}`, color: activeTab === 'servicos' ? '#023047' : '#888888' }} onClick={() => setActiveTab('servicos')}>SERVIÇOS</div>
                <div style={{ padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold', borderBottom: `3px solid ${activeTab === 'detalhes' ? '#FFB703' : 'transparent'}`, color: activeTab === 'detalhes' ? '#023047' : '#888888' }} onClick={() => setActiveTab('detalhes')}>DETALHES</div>
                <div style={{ padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold', borderBottom: `3px solid ${activeTab === 'profissionais' ? '#FFB703' : 'transparent'}`, color: activeTab === 'profissionais' ? '#023047' : '#888888' }} onClick={() => setActiveTab('profissionais')}>PROFISSIONAIS</div>
            </div>

            {/* CONTEÚDO DA ABA */}
            <div style={{ padding: '0 20px' }}>
                {activeTab === 'servicos' && <RenderServicos />}
                {activeTab === 'detalhes' && <RenderDetalhes />}
                {activeTab === 'profissionais' && <RenderProfissionais />}
            </div>

        </div>
    );
};

export default VisualizacaoBarbearia;