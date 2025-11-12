import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FaEdit, FaTrashAlt, FaSave, FaClock, FaCalendarTimes } from 'react-icons/fa';

// =======================================================
// DEFINIÇÕES FORA DO COMPONENTE
// =======================================================

// 1. Dias da semana (Para exibir o status na lista)
const DIAS_SEMANA = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' },
];

// 2. Apenas os valores de Segunda a Sábado (Para a replicação POST)
const REPLICATION_DAYS_VALUES = DIAS_SEMANA.slice(0, 6).map(d => d.value);

// 3. Função auxiliar de tradução
const getDayLabel = (value) => DIAS_SEMANA.find(d => d.value === value)?.label || value;


const GerenciarHorarios = () => {
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [message, setMessage] = useState('');
    
    // Estado para o formulário (Apenas Início e Fim para um NOVO TURNO)
    const [form, setForm] = useState({
        hora_inicio: '08:00',
        hora_fim: '18:00'
    });
    

    // --- LÓGICA DE BUSCA (READ) ---
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

    // --- HANDLERS DE FORMULÁRIO ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    
    // Agrupamento dos horários por dia (para exibição na lista E para verificação de duplicidade)
    const horariosPorDia = horarios.reduce((acc, current) => {
        const dia = current.dia_semana;
        if (!acc[dia]) {
            acc[dia] = [];
        }
        // Armazena a hora_inicio e hora_fim formatada para fácil comparação
        acc[dia].push({ inicio: current.hora_inicio.substring(0, 5), fim: current.hora_fim.substring(0, 5), id: current.id });
        return acc;
    }, {});


    // --- SUBMISSÃO (Adiciona NOVO TURNO para Seg-Sáb apenas se não existir) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Adicionando novo turno de trabalho para a semana...');
        setApiError('');

        const { hora_inicio, hora_fim } = form;

        if (!hora_inicio || !hora_fim || hora_inicio >= hora_fim) {
            setApiError('A hora de início deve ser anterior à hora de fim.');
            setMessage('');
            return;
        }

        try {
            let successfulCreations = 0;
            let skippedDays = [];
            
            // 1. Itera sobre os dias de Segunda a Sábado
            for (const dia of REPLICATION_DAYS_VALUES) {
                
                // 2. VERIFICAÇÃO DE DUPLICIDADE: 
                const existingSlotsForDay = horariosPorDia[dia] || [];
                const isDuplicate = existingSlotsForDay.some(slot => 
                    slot.inicio === hora_inicio && slot.fim === hora_fim
                );

                if (isDuplicate) {
                    skippedDays.push(getDayLabel(dia));
                    continue; // Pula a inserção para este dia
                }
                
                // 3. Insere o NOVO TURNO para o dia
                const dadosParaEnviar = {
                    dia_semana: dia, 
                    hora_inicio: hora_inicio,
                    hora_fim: hora_fim
                };
                await api.post('/horarios', dadosParaEnviar); 
                successfulCreations++;
            }
            
            // 4. Feedback e Limpeza
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
    
    // --- FUNÇÃO PARA DESATIVAR UM DIA (DELETE TODOS OS TURNOS) ---
    const handleDesativarDia = async (diaDaSemana) => {
        if (!window.confirm(`Tem certeza que deseja DESATIVAR o atendimento da ${getDayLabel(diaDaSemana)}? Isso removerá todos os horários deste dia.`)) {
            return;
        }

        setMessage(`Desativando ${getDayLabel(diaDaSemana)}...`);
        setApiError('');

        try {
            // Usa os dados já agrupados e filtrados para obter os IDs
            const slotsToDelete = (horariosPorDia[diaDaSemana] || []).map(s => s.id);

            for (const id of slotsToDelete) {
                await api.delete(`/horarios/${id}`);
            }
            
            setMessage(`Atendimento de ${getDayLabel(diaDaSemana)} desativado com sucesso.`);
            fetchHorarios();
            
        } catch (error) {
            const errorMsg = error.response?.data?.error || `Erro ao desativar ${getDayLabel(diaDaSemana)}.`;
            setApiError(errorMsg);
        }
    };
    
    // --- FUNÇÃO PARA DELETAR UM TURNO ESPECÍFICO ---
    const handleDeleteTurno = async (id) => {
        if (!window.confirm("Deseja DELETAR este turno? Ele será removido do dia correspondente.")) {
            return;
        }
        setMessage('Deletando turno...');
        setApiError('');

        try {
            await api.delete(`/horarios/${id}`);
            setMessage('Turno deletado com sucesso!');
            fetchHorarios();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Erro ao deletar o turno.';
            setApiError(errorMsg);
        }
    }
    

    // --- ESTILOS INLINE E JSX ---
    const cardStyle = { maxWidth: '1000px', margin: '30px auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const buttonStyle = (color) => ({ padding: '8px 15px', backgroundColor: color, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' });
    const desativarButtonStyle = { ...buttonStyle('#D62828'), marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '5px' };


    return (
        <div style={cardStyle}>
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047' }}>
                <FaClock style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                Configurar Horários de Atendimento (Padrão Semanal)
            </h1>
            
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {apiError && <div style={{ color: 'red', marginBottom: '15px' }}>{apiError}</div>}

            {/* --- BLOCO DE DEFINIÇÃO DE NOVO TURNO --- */}
            <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #023047', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 0 10px rgba(2, 48, 71, 0.2)' }}>
                <h3 style={{ color: '#023047', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                    Adicionar Novo Turno à Semana (Segunda a Sábado)
                </h3>
                <p style={{ color: '#555', marginBottom: '20px' }}>
                    Defina um horário. Ele será adicionado como um novo turno de trabalho para **todos** os dias úteis, exceto onde já existir.
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
                        <button type="submit" style={buttonStyle('#023047')} disabled={loading}>
                            <FaSave style={{ marginRight: '5px' }} />
                            Adicionar Novo Turno Semanal
                        </button>
                    </div>
                </form>
            </div>


            {/* --- BLOCO DE EXCEÇÕES E VISUALIZAÇÃO --- */}
            <h2 style={{ color: '#023047', marginBottom: '20px' }}>Status Semanal</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {DIAS_SEMANA.map(day => {
                    const diaEnum = day.value;
                    const slots = horariosPorDia[diaEnum] || [];
                    const isActive = slots.length > 0;
                    
                    const isSunday = diaEnum === 'domingo';
                    
                    const cardBaseStyle = { 
                        padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                    };
                    
                    let cardStyle = {};
                    if (isSunday) {
                        cardStyle = { ...cardBaseStyle, backgroundColor: '#f0f0f0', border: '1px solid #aaa' };
                    } else if (isActive) {
                        cardStyle = { ...cardBaseStyle, backgroundColor: '#e6ffe6', border: '1px solid #4CAF50' };
                    } else {
                        cardStyle = { ...cardBaseStyle, backgroundColor: '#fff0f0', border: '1px solid #ff5722' };
                    }

                    return (
                        <div key={diaEnum} style={cardStyle}>
                            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed #ccc', paddingBottom: '5px', color: isActive ? '#006400' : '#cc0000' }}>
                                {day.label.toUpperCase()} 
                            </h3>
                            
                            {isActive ? (
                                <div>
                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>ATIVO</p>
                                    {/* Mostra todos os turnos para o dia */}
                                    {slots.map((s, index) => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em', color: '#333', marginBottom: '5px' }}>
                                            <span>{s.inicio} - {s.fim}</span>
                                            {/* Permite deletar o turno individual */}
                                            <button onClick={() => handleDeleteTurno(s.id)} style={{ padding: '3px 8px', backgroundColor: '#D62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75em' }}>
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {/* Botão de Desativar TUDO para o dia */}
                                    <button 
                                        onClick={() => handleDesativarDia(diaEnum)} 
                                        style={{ ...desativarButtonStyle, marginTop: '10px' }}
                                        disabled={loading}
                                    >
                                        <FaCalendarTimes /> Desativar Dia
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ margin: '0', color: '#cc0000', fontWeight: 'bold' }}>FECHADO</p>
                                    <p style={{ fontSize: '0.9em', color: '#777' }}>
                                        {isSunday ? 'Domingo é sempre folga.' : 'Dia de folga, ou sem horário definido.'}
                                    </p>
                                    {/* Botão para reativar/aplicar o padrão (adicionando o último turno salvo) */}
                                    {!isSunday && (
                                        <button 
                                            onClick={handleSubmit} 
                                            style={{ ...buttonStyle('#FFB703'), marginTop: '10px' }}
                                            disabled={loading}
                                        >
                                            <FaSave /> Adicionar Padrão
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GerenciarHorarios;