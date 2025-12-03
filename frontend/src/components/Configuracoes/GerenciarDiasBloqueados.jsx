// src/components/Configuracoes/GerenciarDiasBloqueados.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaTrashAlt, FaTimes, FaPlusCircle, FaSpinner } from 'react-icons/fa';
import api from '../../services/api';
import { useUi } from '../../contexts/UiContext'; 


const PRIMARY_COLOR = '#023047';
const ACCENT_COLOR = '#FFB703';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#cc0000';


// Lista inicial vazia — será carregada da API (cada barbeiro tem seus próprios bloqueios)

// O componente recebe 'onCancel' para fechar/voltar
const GerenciarDiasBloqueados = ({ onCancel }) => {
    
    const ui = useUi();
    const [blockedDates, setBlockedDates] = useState([]);
    const [newDate, setNewDate] = useState('');
    const [newReason, setNewReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 🚨 Função helper: garante que a data seja enviada corretamente (sem deslocamento de timezone)
    // O input type="date" retorna YYYY-MM-DD. Normalizamos para evitar ambiguidade.
    const formatDateForBackend = (dateString) => {
        if (!dateString || dateString.length !== 10) return dateString;
        // Input type="date" retorna sempre YYYY-MM-DD — enviar exatamente como está
        return dateString;
    };

    // --- FUNÇÕES DA API ---
    
    // Adiciona um dia bloqueado via API (fica associado ao barbeiro logado)
    const handleAddBlockedDate = async (e) => {
        e.preventDefault();
        if (isProcessing) return;

        if (!newDate || !newReason) {
            ui.showPostIt('Preencha a data e o motivo.', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const resp = await api.post('/blocked-dates', { date: formatDateForBackend(newDate), reason: newReason });
            const newEntry = { id: resp.data.id, date: newDate, reason: newReason };
            setBlockedDates(prev => [...prev, newEntry]);
            setNewDate('');
            setNewReason('');
            ui.showPostIt('Dia bloqueado adicionado com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao adicionar dia bloqueado:', err);
            const message = err.response?.data?.error || 'Falha ao bloquear o dia.';
            ui.showPostIt(message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Remove dia bloqueado via API
    const handleRemoveBlockedDate = async (id) => {
        const ok = await ui.confirm('Tem certeza que deseja remover este dia da lista de bloqueio?');
        if (!ok) return;

        setIsProcessing(true);
        try {
            await api.delete(`/blocked-dates/${id}`);
            setBlockedDates(prev => prev.filter(d => d.id !== id));
            ui.showPostIt('Dia bloqueado removido com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao remover dia bloqueado:', err);
            ui.showPostIt('Falha ao remover dia bloqueado.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    /* --- ESTILOS --- */
    const containerStyle = {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        borderTop: `5px solid ${ACCENT_COLOR}`,
        marginBottom: '30px'
    };
    
    const inputStyle = {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginRight: '10px',
        fontSize: '1em',
        width: '150px'
    };
    
    const buttonStyle = {
        backgroundColor: PRIMARY_COLOR,
        color: ACCENT_COLOR,
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold'
    };
    
    // Helper para formatar a data (opcionalmente)
    const formatDate = (isoDate) => {
        if (!isoDate || isoDate.includes('/')) return isoDate; // Se já estiver formatado
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`; // YYYY-MM-DD -> DD/MM/YYYY
        }
        return isoDate;
    };


    // Carrega os dias bloqueados do barbeiro logado ao montar
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const resp = await api.get('/blocked-dates/meus');
                if (!mounted) return;
                setBlockedDates(resp.data || []);
            } catch (err) {
                console.error('Erro ao carregar dias bloqueados:', err);
                ui.showPostIt('Falha ao carregar dias bloqueados.', 'error');
            }
        };
        load();
        return () => { mounted = false; };
    }, [ui]);

    return (
        <div style={containerStyle}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ color: PRIMARY_COLOR, margin: '0' }}>
                    <FaCalendarAlt style={{ marginRight: '10px' }} /> Gerenciar Dias Bloqueados
                </h2>
                {/* 💡 BOTÃO PARA FECHAR/VOLTAR */}
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY_COLOR }} disabled={isProcessing}>
                    <FaTimes size={24} />
                </button>
            </div>
            
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Adicione datas em que não será possível realizar agendamentos (ex: feriados, folgas, manutenção).
            </p>

            {/* --- FORMULÁRIO DE ADIÇÃO --- */}
            <form onSubmit={handleAddBlockedDate} style={{ display: 'flex', marginBottom: '30px', alignItems: 'center' }}>
                
                <input 
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    style={inputStyle}
                    disabled={isProcessing}
                />
                
                <input 
                    type="text"
                    placeholder="Motivo (Ex: Natal, Folga)"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    style={{ ...inputStyle, width: '250px', marginRight: '15px' }}
                    required
                    disabled={isProcessing}
                />
                
                <button type="submit" style={buttonStyle} disabled={isProcessing}>
                    {isProcessing ? <FaSpinner className="spinner" /> : <FaPlusCircle />} Adicionar
                </button>
            </form>

            {/* --- LISTAGEM DE DIAS BLOQUEADOS --- */}
            <div>
                <h3>Datas de Exceção Ativas ({blockedDates.length})</h3>
                <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                    
                    {blockedDates.map(date => (
                        <div key={date.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ fontWeight: 'bold' }}>{formatDate(date.date)}</span>
                            <span>{date.reason}</span>
                            <button 
                                onClick={() => handleRemoveBlockedDate(date.id)}
                                style={{ background: 'none', border: 'none', color: ERROR_COLOR, cursor: 'pointer' }}
                                disabled={isProcessing}
                            >
                                <FaTrashAlt />
                            </button>
                        </div>
                    ))}
                    
                    {blockedDates.length === 0 && (
                        <p style={{ color: '#888', textAlign: 'center' }}>Nenhuma data bloqueada.</p>
                    )}
                </div>
            </div>
            
            {/* 💡 BOTÃO PRINCIPAL DE VOLTAR (caso o botão X não seja usado) */}
            <button 
                onClick={onCancel} 
                style={{ ...buttonStyle, backgroundColor: '#ccc', color: '#333', marginTop: '30px', width: '100%' }}
                disabled={isProcessing}
            >
                <FaTimes /> Fechar Painel
            </button>
            
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default GerenciarDiasBloqueados;