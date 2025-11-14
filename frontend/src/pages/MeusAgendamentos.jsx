// src/pages/MeusAgendamentos.jsx

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendarCheck, FaClock, FaDollarSign, FaUserCircle, FaSpinner } from 'react-icons/fa';

const MeusAgendamentos = () => {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const clienteId = user?.userId;

    useEffect(() => {
        const fetchAgendamentos = async () => {
            if (user?.userType !== 'cliente' || !clienteId) {
                setError("Acesso negado. Esta página é exclusiva para clientes logados.");
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError('');

            try {
                // NOVA ROTA NECESSÁRIA: /agendamentos/cliente/:clienteId
                const response = await api.get(`/agendamentos/cliente/${clienteId}`);
                setAgendamentos(response.data);
            } catch (err) {
                console.error("Erro ao buscar agendamentos do cliente:", err);
                setError(err.response?.data?.error || "Falha ao carregar seus agendamentos.");
            } finally {
                setLoading(false);
            }
        };

        fetchAgendamentos();
    }, [clienteId, user?.userType]);

    // Funções de formatação
    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'concluido': return { color: 'white', backgroundColor: 'green', padding: '4px 8px', borderRadius: '4px' };
            case 'cancelado': return { color: 'white', backgroundColor: 'red', padding: '4px 8px', borderRadius: '4px' };
            case 'agendado': 
            default: return { color: 'black', backgroundColor: '#FFB703', padding: '4px 8px', borderRadius: '4px' };
        }
    };
    
    // LÓGICA DE RENDERIZAÇÃO
    if (loading) {
        return <h1 style={{ padding: '50px', textAlign: 'center' }}><FaSpinner className="spinner" /> Carregando agendamentos...</h1>;
    }

    if (error) {
        return <h1 style={{ padding: '50px', color: 'red' }}>{error}</h1>;
    }
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1 style={{ color: '#023047', borderBottom: '2px solid #FFB703', paddingBottom: '10px' }}>
                <FaCalendarCheck style={{ marginRight: '10px' }}/> Meus Agendamentos
            </h1>

            {agendamentos.length === 0 ? (
                <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Você ainda não possui agendamentos ativos. Agende seu próximo serviço!</p>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {agendamentos.map(ag => (
                        <div key={ag.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            
                            {/* LINHA 1: Destaque */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: '#023047' }}>{ag.nome_servico || 'Serviço'}</h3>
                                <span style={getStatusStyle(ag.status)}>{ag.status.toUpperCase()}</span>
                            </div>
                            
                            {/* LINHA 2: Detalhes */}
                            <p style={{ margin: '10px 0 5px 0' }}>
                                <FaUserCircle style={{ marginRight: '5px' }}/> Barbeiro: **{ag.nome_barbeiro}**
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <FaClock style={{ marginRight: '5px' }}/> Horário: **{formatDateTime(ag.data_hora_inicio)}**
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <FaDollarSign style={{ marginRight: '5px', color: 'green' }}/> Valor: **R$ {parseFloat(ag.valor_servico).toFixed(2)}**
                            </p>
                            
                            {/* LINHA 3: Observações (Se houver) */}
                            {(ag.observacao || ag.preferencia) && (
                                <p style={{ margin: '15px 0 0 0', fontSize: '0.9em', color: '#777', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                                    {ag.observacao && `Obs: ${ag.observacao}`} 
                                    {ag.preferencia && ` | Preferência: ${ag.preferencia}`}
                                </p>
                            )}
                            
                            {/* Aqui caberiam botões de Cancelar/Remarcar */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MeusAgendamentos;