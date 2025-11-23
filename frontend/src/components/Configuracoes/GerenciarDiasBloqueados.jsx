// src/components/Configuracoes/GerenciarDiasBloqueados.jsx - VERSÃO FINAL ESTÁVEL

import React, { useState, useEffect, useCallback } from 'react';
import api from "../../services/api"; // 🚨 CAMINHO CORRIGIDO
import { useUi } from "../../contexts/UiContext"; // Também ajustando o useUi por segurança
import { FaCalendarTimes, FaPlusCircle, FaTrashAlt, FaSpinner } from 'react-icons/fa';

const GerenciarDiasBloqueados = () => {
    const ui = useUi();
    const [diasBloqueados, setDiasBloqueados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    
    const [newDate, setNewDate] = useState('');
    const [newReason, setNewReason] = useState('');

    // --- FUNÇÕES DE BUSCA ---
    const fetchDiasBloqueados = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            // Rota GET /blocked-dates/meus
            const response = await api.get('/blocked-dates/meus');
            setDiasBloqueados(response.data);
        } catch (error) {
            setApiError(error.response?.data?.error || 'Erro ao carregar dias bloqueados.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDiasBloqueados();
    }, [fetchDiasBloqueados]);


    // --- FUNÇÃO ADICIONAR ---
    const handleAddBlockedDate = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!newDate) {
            setApiError('A data é obrigatória.');
            return;
        }

        try {
            // Rota POST /blocked-dates
            await api.post('/blocked-dates', { 
                date: newDate, 
                reason: newReason || 'Folga do profissional' 
            });

            ui.showPostIt('Dia bloqueado adicionado com sucesso!', 'success');
            setNewDate('');
            setNewReason('');
            fetchDiasBloqueados(); // Recarrega a lista
            
        } catch (error) {
            setApiError(error.response?.data?.error || 'Erro ao adicionar o dia bloqueado.');
        }
    };
    
    // --- FUNÇÃO REMOVER ---
    const handleDeleteBlockedDate = async (id) => {
        const ok = await ui.confirm('Tem certeza que deseja remover este dia da lista de bloqueio?');
        if (!ok) return;

        try {
            // Rota DELETE /blocked-dates/:id
            await api.delete(`/blocked-dates/${id}`);
            ui.showPostIt('Dia bloqueado removido com sucesso!', 'success');
            fetchDiasBloqueados(); 
        } catch (error) {
            setApiError(error.response?.data?.error || 'Erro ao remover o dia bloqueado.');
        }
    };

    // --- RENDERIZAÇÃO ---
    const primaryColor = '#023047';
    const accentColor = '#FFB703';

    if (loading) {
        return <p style={{ textAlign: 'center', padding: '20px' }}><FaSpinner className="spinner" /> Carregando dias...</p>;
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '800px', margin: '20px auto', backgroundColor: '#fff' }}>
            <h2 style={{ color: primaryColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: '10px' }}>
                <FaCalendarTimes style={{ marginRight: '10px' }}/> Gerenciar Dias Bloqueados
            </h2>
            <p>Adicione datas em que não será possível realizar agendamentos (ex: feriados, folgas, manutenção).</p>

            {apiError && <div style={{ color: 'red', marginBottom: '15px' }}>{apiError}</div>}

            {/* FORMULÁRIO DE ADIÇÃO */}
            <form onSubmit={handleAddBlockedDate} style={{ display: 'flex', gap: '10px', marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '5px' }}>
                <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)} 
                    required 
                    style={{ padding: '8px', flexShrink: 0 }}
                />
                <input 
                    type="text" 
                    value={newReason} 
                    onChange={(e) => setNewReason(e.target.value)} 
                    placeholder="Motivo (Ex: Natal, Folga)" 
                    style={{ padding: '8px', flexGrow: 1 }}
                />
                <button type="submit" style={{ padding: '8px 15px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', flexShrink: 0 }}>
                    <FaPlusCircle /> Adicionar
                </button>
            </form>

            {/* LISTA DE DIAS BLOQUEADOS */}
            <h3>Datas de Exceção Ativas ({diasBloqueados.length})</h3>
            
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {diasBloqueados.map(dia => (
                    <li key={dia.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px dashed #eee', backgroundColor: '#f9f9f9', marginBottom: '5px' }}>
                        
                        <span style={{ fontWeight: 'bold' }}>
                            {new Date(dia.date).toLocaleDateString('pt-BR')}
                        </span>
                        
                        <span style={{ color: '#555', fontStyle: 'italic' }}>
                            {dia.reason}
                        </span>
                        
                        <button 
                            onClick={() => handleDeleteBlockedDate(dia.id)}
                            style={{ padding: '5px 10px', backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            <FaTrashAlt size={12} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GerenciarDiasBloqueados;