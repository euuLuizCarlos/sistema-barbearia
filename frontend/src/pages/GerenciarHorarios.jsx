// src/pages/GerenciarHorarios.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FaSave, FaClock, FaCalendarTimes, FaTrashAlt, FaCheck, FaMousePointer } from 'react-icons/fa'; 
import { useUi } from '../contexts/UiContext';
import ModalExclusaoHorarios from '../components/ControleCaixa/ModalExclusaoHorarios.jsx'; 


// =======================================================
// DEFINIÇÕES DE CORES LOCAIS 
// =======================================================
const COLORS = {
    PRIMARY: '#023047',      // Azul Escuro 
    ACCENT: '#FFB703',       // Amarelo Dourado 
    SUCCESS: '#4CAF50',      // Verde 
    ERROR: '#cc0000',        // Vermelho 
    BACKGROUND_LIGHT: '#f5f5f5', // Fundo Claro
    SECONDARY_TEXT: '#888888', // Texto Secundário
};


// =======================================================
// DEFINIÇÕES AUXILIARES
// =======================================================

// 1. Dias da semana (7 dias)
const DIAS_SEMANA = [
    { value: 'domingo', label: 'Domingo' }, 
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
];

const REPLICATION_DAYS_VALUES = DIAS_SEMANA.map(d => d.value);
const getDayLabel = (value) => DIAS_SEMANA.find(d => d.value === value)?.label || value;


const GerenciarHorarios = () => {
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [message, setMessage] = useState('');
    
    // ESTADOS DE GESTÃO
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState([]); // Array de IDs
    const [horarioToDelete, setHorarioToDelete] = useState(null); // Para modal de exclusão flexível
    
    const [form, setForm] = useState({
        hora_inicio: '08:00',
        hora_fim: '18:00'
    });
    
    const ui = useUi();


    // --- 1. FUNÇÕES DE BUSCA E MAPEAMENTO ---
    const fetchHorarios = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const response = await api.get('/horarios/meus');
            setHorarios(response.data);
        } catch (error) {
            setApiError('Erro ao carregar horários. Verifique a API e o banco de dados.');
            console.error('Erro ao listar horários:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHorarios();
    }, [fetchHorarios]);

    // HANDLER DE ALTERAÇÃO DE FORMULÁRIO
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    
    // Agrupamento dos horários por dia
    const horariosPorDia = (() => {
        return horarios.reduce((acc, current) => {
            const dia = current.dia_semana;
            if (!acc[dia]) {
                acc[dia] = [];
            }
            acc[dia].push({ 
                inicio: current.hora_inicio.substring(0, 5), 
                fim: current.hora_fim.substring(0, 5), 
                id: current.id 
            });
            return acc;
        }, {});
    })();


    // --- 2. LÓGICA DE SELEÇÃO EM MASSA (FRONT) ---

    const toggleSlotSelection = (slotId) => {
        if (selectedSlots.includes(slotId)) {
            setSelectedSlots(selectedSlots.filter(id => id !== slotId));
        } else {
            setSelectedSlots([...selectedSlots, slotId]);
        }
    };
    
    const activateSelectionMode = () => {
        setIsSelectionMode(true);
        setSelectedSlots([]);
        setMessage('Modo de Seleção Ativado. Clique nos horários para marcar.');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleDeleteSelected = async () => {
        if (selectedSlots.length === 0) {
            ui.showPostIt('Nenhum horário selecionado para exclusão.', 'error');
            return;
        }

        const ok = await ui.confirm(`Tem certeza que deseja excluir ${selectedSlots.length} horários selecionados?`);
        if (!ok) return;

        setMessage(`Excluindo ${selectedSlots.length} horários...`);
        setApiError('');
        setIsSelectionMode(false); // Sai do modo de seleção

        try {
            for (const slotId of selectedSlots) {
                await api.delete(`/horarios/${slotId}`);
            }

            ui.showPostIt(`${selectedSlots.length} horários excluídos com sucesso!`, 'success');
            setSelectedSlots([]);
            fetchHorarios();

        } catch (error) {
            setApiError(error.response?.data?.error || `Falha ao excluir horários em massa. Tente novamente.`);
            ui.showPostIt(apiError, 'error');
            fetchHorarios(); 
        }
    };


    // --- 3. SUBMISSÃO E EXCLUSÃO FLEXÍVEL ---
    
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setMessage('Adicionando novo turno de trabalho para a semana...');
        setApiError('');

        const { hora_inicio, hora_fim } = form;

        if (!hora_inicio || !hora_fim || hora_inicio >= hora_fim) {
            setApiError('A hora de início deve ser anterior à hora de fim.');
            setMessage('');
            return;
        }
        setIsSelectionMode(false); 

        try {
            let successfulCreations = 0;
            let skippedDays = [];
            
            // Itera sobre TODOS os 7 dias
            for (const dia of REPLICATION_DAYS_VALUES) {
                
                const existingSlotsForDay = horariosPorDia[dia] || [];
                const isDuplicate = existingSlotsForDay.some(slot => 
                    slot.inicio === hora_inicio && slot.fim === hora_fim
                );

                if (isDuplicate) {
                    skippedDays.push(getDayLabel(dia));
                    continue; // Pula a inserção para este dia
                }
                
                const dadosParaEnviar = { dia_semana: dia, hora_inicio, hora_fim };
                await api.post('/horarios', dadosParaEnviar); 
                successfulCreations++;
            }
            
            let successMsg = `Sucesso! Novo turno (${hora_inicio} - ${hora_fim}) adicionado a ${successfulCreations} dias.`;
            if (skippedDays.length > 0) {
                 successMsg += ` (Ignorado em: ${skippedDays.join(', ')} - Horário já existia)`;
            }

            setMessage(successMsg);
            setForm({ hora_inicio: '08:00', hora_fim: '18:00' }); 
            fetchHorarios(); 
            
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Erro ao adicionar o novo turno. Verifique se o servidor está rodando.';
            setApiError(errorMsg);
            console.error('Erro na submissão:', error);
        }
    };

    // 1. Abre o modal de opções de exclusão (para exclusão NÃO em massa)
    const handleStartDelete = (slotId, diaSemana, horaInicio, horaFim) => {
        if (isSelectionMode) {
             toggleSlotSelection(slotId); // No modo de seleção, o clique apenas marca
             return;
        }
        // Se NÃO está no modo de seleção, abre o modal de exclusão flexível
        setHorarioToDelete({ 
            id: slotId, 
            dia_semana: diaSemana, 
            hora_inicio: horaInicio, 
            hora_fim: horaFim 
        });
        setMessage(''); 
        setApiError('');
    };

    // 2. Executa a exclusão com base na opção selecionada (single, day, all-week)
    const handleConfirmDelete = async (deleteOption) => {
        if (!horarioToDelete) return;

        const { hora_inicio, hora_fim } = horarioToDelete;
        const targetId = horarioToDelete.id; // ID do slot clicado
        setHorarioToDelete(null); // Fecha o modal imediatamente
        setMessage('Processando exclusão...');

        try {
            let slotsToDelete = [];
            let successMessage = `Turno (${hora_inicio} - ${hora_fim}) excluído com sucesso!`;

            if (deleteOption === 'single') {
                slotsToDelete = [targetId];
            } else if (deleteOption === 'day') {
                slotsToDelete = horarios
                    .filter(h => h.dia_semana === horarioToDelete.dia_semana && 
                                 h.hora_inicio.substring(0, 5) === hora_inicio && 
                                 h.hora_fim.substring(0, 5) === hora_fim)
                    .map(h => h.id);
            } else if (deleteOption === 'all-week') {
                slotsToDelete = horarios
                    .filter(h => h.hora_inicio.substring(0, 5) === hora_inicio && 
                                 h.hora_fim.substring(0, 5) === hora_fim)
                    .map(h => h.id);
            }

            if (slotsToDelete.length > 0) {
                for (const slotId of slotsToDelete) {
                    await api.delete(`/horarios/${slotId}`);
                }
                ui.showPostIt(successMessage, 'success');
            }
            
            fetchHorarios(); 

        } catch (error) {
            setApiError(error.response?.data?.error || `Falha ao excluir horários. Tente novamente.`);
            ui.showPostIt(error.response?.data?.error || `Falha ao excluir horários. Tente novamente.`, 'error');
        }
    };
    
    // --- FUNÇÃO PARA DESATIVAR UM DIA COMPLETO (DELETE TODOS OS TURNOS DO DIA) ---
    const handleDesativarDia = async (diaDaSemana) => {
        const ok = await ui.confirm(`Tem certeza que deseja DESATIVAR o atendimento da ${getDayLabel(diaDaSemana)}? Isso removerá todos os horários deste dia.`);
        if (!ok) return;

        setMessage(`Desativando ${getDayLabel(diaDaSemana)}...`);
        setApiError('');

        try {
            const slotsToDelete = (horariosPorDia[diaDaSemana] || []).map(s => s.id);

            if (slotsToDelete.length > 0) {
                 for (const id of slotsToDelete) {
                    await api.delete(`/horarios/${id}`);
                }
            } else {
                 setMessage(`Não havia horários para desativar na ${getDayLabel(diaDaSemana)}.`);
            }
           
            ui.showPostIt(`Atendimento de ${getDayLabel(diaDaSemana)} desativado com sucesso.`, 'success');
            fetchHorarios();
            
        } catch (error) {
            const errorMsg = error.response?.data?.error || `Erro ao desativar ${getDayLabel(diaDaSemana)}.`;
            setApiError(errorMsg);
            ui.showPostIt(errorMsg, 'error');
        }
    };
    
    // --- RENDERIZAÇÃO ---
    const cardStyleBase = { maxWidth: '1000px', margin: '30px auto', padding: '20px', backgroundColor: COLORS.BACKGROUND_LIGHT, borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const buttonStyle = (color) => ({ padding: '8px 15px', backgroundColor: color, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' });
    const desativarButtonStyle = { ...buttonStyle(COLORS.ERROR), marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '5px' };


    return (
        <div style={cardStyleBase}>
            <h1 style={{ borderBottom: `2px solid ${COLORS.PRIMARY}`, paddingBottom: '10px', marginBottom: '30px', color: COLORS.PRIMARY }}>
                <FaClock style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                Configurar Horários de Atendimento (Padrão Semanal)
            </h1>
            
            {message && <div style={{ color: COLORS.SUCCESS, marginBottom: '15px', fontWeight: 'bold' }}>{message}</div>}
            {apiError && <div style={{ color: COLORS.ERROR, marginBottom: '15px', fontWeight: 'bold' }}>{apiError}</div>}

            {/* --- BLOCO DE DEFINIÇÃO DE NOVO TURNO (REPLICAÇÃO) --- */}
            <div style={{ marginBottom: '40px', padding: '20px', border: `1px solid ${COLORS.PRIMARY}`, borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 0 10px rgba(2, 48, 71, 0.2)' }}>
                <h3 style={{ color: COLORS.PRIMARY, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                    Adicionar Novo Turno à Semana (7 Dias)
                </h3>
                <p style={{ color: COLORS.SECONDARY_TEXT, marginBottom: '20px' }}>
                    Defina um horário. Ele será adicionado como um novo turno de trabalho para **todos** os 7 dias, exceto onde já existir.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                    
                    {/* Campo Hora Início */}
                    <div style={{ flex: 1 }}>
                        <label>HORA INÍCIO *</label>
                        <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} style={inputStyle} required />
                    </div>

                    {/* Campo Hora Fim */}
                    <div style={{ flex: 1 }}>
                        <label>HORA FIM *</label>
                        <input type="time" name="hora_fim" value={form.hora_fim} onChange={handleChange} style={inputStyle} required />
                    </div>

                    {/* Botão de Ação */}
                    <div style={{ flex: 1, paddingTop: '30px' }}>
                        <button type="submit" style={buttonStyle(COLORS.PRIMARY)} disabled={loading}>
                            <FaSave style={{ marginRight: '5px' }} />
                            Adicionar Novo Turno Semanal
                        </button>
                    </div>
                </form>
            </div>


            {/* --- BLOCO DE EXCEÇÕES E VISUALIZAÇÃO --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: COLORS.PRIMARY, margin: 0 }}>Status Semanal</h2>
                
                {/* Botão de Ativar Modo de Seleção */}
                {!isSelectionMode && (
                    <button 
                        onClick={activateSelectionMode} 
                        style={buttonStyle(COLORS.ACCENT)}
                        title="Ativar seleção em massa"
                    >
                        <FaMousePointer style={{ marginRight: '5px' }} />
                        Modo Seleção
                    </button>
                )}

                {/* Botão de Excluir Selecionados (Aparece no modo ativo) */}
                {isSelectionMode && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={handleDeleteSelected} 
                            disabled={selectedSlots.length === 0}
                            style={buttonStyle(COLORS.ERROR)}
                        >
                            <FaTrashAlt style={{ marginRight: '5px' }} />
                            Excluir {selectedSlots.length} Selecionado(s)
                        </button>
                        <button 
                            onClick={() => setIsSelectionMode(false)} 
                            style={buttonStyle(COLORS.SECONDARY_TEXT)}
                        >
                            Cancelar Seleção
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {DIAS_SEMANA.map(day => {
                    const diaEnum = day.value;
                    const slots = horariosPorDia[diaEnum] || [];
                    const isActive = slots.length > 0;
                    
                    let cardStyle = {};
                    // Define o estilo do cartão interno
                    if (isActive) {
                        cardStyle = { padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#e6ffe6', border: `1px solid ${COLORS.SUCCESS}` };
                    } else {
                        cardStyle = { padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff0f0', border: `1px solid ${COLORS.ERROR}` };
                    }

                    return (
                        <div key={diaEnum} style={cardStyle}>
                            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed #ccc', paddingBottom: '5px', color: isActive ? COLORS.SUCCESS : COLORS.ERROR }}>
                                {day.label.toUpperCase()} 
                            </h3>
                            
                            {isActive ? (
                                <div>
                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>ATIVO</p>
                                    {/* Mapeia os slots */}
                                    {slots.map((s) => {
                                        const isSelected = selectedSlots.includes(s.id);
                                        const slotCardStyle = {
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            marginBottom: '5px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? COLORS.ACCENT : 'transparent',
                                            color: isSelected ? COLORS.PRIMARY : '#333',
                                            border: isSelected ? `1px solid ${COLORS.PRIMARY}` : 'none',
                                            transition: 'background-color 0.2s',
                                        };

                                        return (
                                            // ESTABILIDADE DO DOM: Layout Consistente
                                            <div 
                                                key={s.id} 
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em', ...slotCardStyle }}
                                                onClick={() => handleStartDelete(s.id, diaEnum, s.inicio, s.fim)} 
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                    {/* Ícone de check (VISÍVEL APENAS em Modo de Seleção) */}
                                                    {isSelectionMode && <FaCheck style={{ marginRight: '5px', color: isSelected ? COLORS.PRIMARY : COLORS.SECONDARY_TEXT }} />}
                                                    {s.inicio} - {s.fim}
                                                </span>
                                                
                                                {/* Contêiner da Ação (Estável no lado direito) */}
                                                <div style={{ width: '30px', textAlign: 'right', flexShrink: 0 }}>
                                                    {/* Botão de exclusão individual (SÓ APARECE FORA DO MODO DE SELEÇÃO) */}
                                                    {!isSelectionMode && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleStartDelete(s.id, diaEnum, s.inicio, s.fim); }} 
                                                            style={{ padding: '3px 8px', backgroundColor: COLORS.ERROR, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75em' }}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Botão de Desativar TUDO para o dia */}
                                    <button 
                                        onClick={() => handleDesativarDia(diaEnum)} 
                                        style={{ ...desativarButtonStyle, marginTop: '10px' }}
                                        disabled={loading || isSelectionMode}
                                    >
                                        <FaCalendarTimes /> Desativar Dia Completo
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ margin: '0', color: COLORS.ERROR, fontWeight: 'bold' }}>FECHADO</p>
                                    <p style={{ fontSize: '0.9em', color: COLORS.SECONDARY_TEXT }}>
                                        Dia de folga, ou sem horário definido.
                                    </p>
                                    {/* Botão para reativar/aplicar o padrão */}
                                    <button 
                                        onClick={handleSubmit} 
                                        style={{ ...buttonStyle(COLORS.ACCENT), color: COLORS.PRIMARY, marginTop: '10px' }}
                                        disabled={loading || isSelectionMode}
                                    >
                                        <FaSave /> Aplicar Último Padrão
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* RENDERIZAÇÃO DO MODAL DE EXCLUSÃO MÚLTIPLA (Não em massa) */}
            {horarioToDelete && !isSelectionMode && (
                <ModalExclusaoHorarios 
                    slot={horarioToDelete}
                    onClose={() => setHorarioToDelete(null)}
                    onConfirm={handleConfirmDelete} // Passa a função de exclusão em massa
                />
            )}
        </div>
    );
};

export default GerenciarHorarios;