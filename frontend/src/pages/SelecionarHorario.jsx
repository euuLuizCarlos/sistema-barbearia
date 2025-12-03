// src/pages/SelecionarHorario.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';
import { FaChevronLeft, FaCalendarAlt, FaClock, FaUserCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';

// Importar DatePicker e CSS
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; 

// Importar o novo Modal de Confirmação
import ModalConfirmacao from '../components/Agendamento/ModalConfirmacao'; 


// --- FUNÇÕES UTILIITÁRIAS DE DATA ---
// 🚨 CORREÇÃO: Retorna a data no formato YYYY-MM-DD usando timezone LOCAL (não UTC)
// Isso evita problemas de deslocamento de data em diferentes timezones (ex: Brasil -3 UTC)
const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Retorna o nome do dia da semana (ex: Qui, Sex)
const getDayName = (date) => date.toLocaleDateString('pt-BR', { weekday: 'short' });

// Gera um array de 7 dias a partir de uma data inicial
const generateWeekDays = (startDate) => {
    const dates = [];
    let current = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        dates.push({
            date: new Date(current),
            dayName: getDayName(current)
        });
        current.setDate(current.getDate() + 1);
    }
    return dates;
};
// -------------------------------------------------------------------

const SelecionarHorario = () => {
    const { barbeiroId, servicoId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const ui = useUi();
    
    // --- ESTADOS DE SELEÇÃO E DADOS ---
    const [profissionais, setProfissionais] = useState([]);
    const [servicoInfo, setServicoInfo] = useState(null);
    const [selectedBarbeiro, setSelectedBarbeiro] = useState(null);
    
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [loadingHorarios, setLoadingHorarios] = useState(false);
    const [error, setError] = useState('');
    
    // NOVO ESTADO: Controla a visibilidade do calendário completo
    const [showCalendar, setShowCalendar] = useState(false); 
    
    // NOVO ESTADO: Armazena os dados temporários do agendamento para o Modal
    const [tempAgendamentoData, setTempAgendamentoData] = useState(null); 

    const clienteId = user?.userId;

    // WeekDays: Usa a data atual (do servidor) como ponto de partida
    const weekDays = useMemo(() => generateWeekDays(new Date()), []);

    // --- 1. BUSCA INICIAL DE PROFISSIONAIS E SERVIÇO ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!clienteId) { 
                setError("Faça login para agendar.");
                setLoading(false);
                return;
            }
            try {
                // Busca de profissionais e serviço
                const [profissionaisRes, servicoRes] = await Promise.all([
                    api.get(`/barbearia/${barbeiroId}/profissionais`),
                    api.get(`/servicos/${servicoId}`) 
                ]);
                
                setProfissionais(profissionaisRes.data);
                setServicoInfo(servicoRes.data);
                
                // Pré-seleciona o barbeiro principal
                const principal = profissionaisRes.data.find(p => p.id === parseInt(barbeiroId));
                setSelectedBarbeiro(principal || profissionaisRes.data[0]);

            } catch (err) {
                console.error("Erro ao carregar dados iniciais:", err);
                setError(err.response?.data?.error || "Erro ao carregar profissionais ou serviço.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [barbeiroId, servicoId, clienteId]);
    
    
    // --- LÓGICA DE SELEÇÃO DE DATA ---
    const handleDateChange = (date) => {
        // Atualiza a data selecionada e fecha o modal/picker
        setSelectedDate(date); 
        setShowCalendar(false);
    };

    // --- 2. BUSCA DE HORÁRIOS DISPONÍVEIS ---
    const fetchHorarios = useCallback(async (barbeiro, dateObj) => {
        if (!barbeiro || !dateObj || !servicoId) return;
        
        const dateString = formatDateToISO(dateObj); 
        
        setLoadingHorarios(true);
        setHorariosDisponiveis([]);
        setError('');

        try {
            const response = await api.get(`/agendamento/${barbeiro.id}/disponibilidade/${dateString}/${servicoId}`);
            setHorariosDisponiveis(response.data.disponiveis);
            
        } catch (err) {
            console.error("Erro ao buscar horários:", err);
            setError(err.response?.data?.message || err.response?.data?.error || "Erro ao calcular horários disponíveis.");
        } finally {
            setLoadingHorarios(false);
        }
    }, [servicoId]);

    // Dispara a busca de horários sempre que a data ou o barbeiro mudar
    useEffect(() => {
        if (selectedBarbeiro && selectedDate) {
            fetchHorarios(selectedBarbeiro, selectedDate);
        }
    }, [selectedBarbeiro, selectedDate, fetchHorarios]);


    // --- 3. AÇÃO DE AGENDAMENTO (ABRE O MODAL) ---
    const handleAgendar = async (horaSelecionada) => {
        if (!selectedBarbeiro || !selectedDate || !clienteId || !servicoInfo) {
            ui.showPostIt('Erro: Seleção incompleta.', 'error');
            return;
        }

        // Define os dados para passar ao modal
        setTempAgendamentoData({
            barbeiro: selectedBarbeiro, 
            servico: servicoInfo,
            data: selectedDate, // Objeto Date para formatação no modal
            horaSelecionada: horaSelecionada,
        });
    };
    
    // --- 4. AÇÃO DE CONFIRMAÇÃO FINAL (DISPARA O POST REAL) ---
    const handleFinalConfirm = async (horaSelecionada, adicionais) => {
        // Fecha o modal imediatamente
        setTempAgendamentoData(null); 
        
        if (!selectedBarbeiro || !selectedDate || !clienteId || !servicoInfo) return;

        const dateString = formatDateToISO(selectedDate); 
        const dataHoraInicio = `${dateString} ${horaSelecionada}:00`;
        
        try {
            const response = await api.post('/agendamentos', {
                cliente_id: clienteId,
                barbeiro_id: selectedBarbeiro.id,
                servico_id: parseInt(servicoId), 
                data_hora_inicio: dataHoraInicio,
                valor_servico: parseFloat(servicoInfo.preco),
                observacao: adicionais.observacao,
                preferencia: adicionais.preferencia // "Conversar" / "Não Conversar"
            });
            
            ui.showPostIt(response.data.message || `Agendamento confirmado para ${horaSelecionada}!`, 'success');
            navigate('/meus-agendamentos'); 

        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao agendar. Verifique o console.';
            ui.showPostIt(`Falha no agendamento: ${msg}`, 'error');
            console.error(err);
        }
    };


    // --- RENDERIZAÇÃO ---
    
    const primaryColor = '#023047';
    const accentColor = '#FFB703';
    const cardStyle = (isSelected) => ({
        padding: '10px', margin: '5px', borderRadius: '8px', cursor: 'pointer',
        backgroundColor: isSelected ? accentColor : '#f0f0f0',
        color: isSelected ? primaryColor : '#333',
        textAlign: 'center', fontWeight: 'bold'
    });
    const isMobile = window.innerWidth < 768; 

    const horariosManha = horariosDisponiveis.filter(h => parseInt(h.split(':')[0]) < 12);
    const horariosTarde = horariosDisponiveis.filter(h => parseInt(h.split(':')[0]) >= 12);
    
    const selectedDateString = formatDateToISO(selectedDate);
    const todayDateString = formatDateToISO(new Date());
    
    // Estilos para o Modal/Overlay do Calendário (Opcional, se precisar)
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
    };
    const modalContentStyle = {
        background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        maxWidth: '350px',
    };


    if (loading) {
        return <h1 style={{ padding: '50px' }}>Carregando dados de agendamento...</h1>;
    }
    
    if (error && !profissionais.length) {
        return <h1 style={{ padding: '50px', color: 'red' }}>{error}</h1>;
    }


    return (
        <div style={{ maxWidth: isMobile ? '100%' : '800px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: '1.5em', marginBottom: '20px' }}>
                <FaChevronLeft />
            </button>
            
            <h1 style={{ color: primaryColor, borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                Agendar: {servicoInfo?.nome || 'Serviço'}
            </h1>
            <p style={{ color: '#555', marginBottom: '30px' }}>
                Duração: **{servicoInfo?.duracao_minutos} min** | Preço: **R$ {parseFloat(servicoInfo?.preco || 0).toFixed(2)}**
            </p>

            {/* --- 1. SELEÇÃO DE DATA (CARROSSEL SEMANAL E BOTÃO DE CALENDÁRIO) --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: primaryColor, fontSize: '1.4em', margin: 0 }}><FaCalendarAlt style={{ marginRight: '10px' }}/> 1. Selecione a Data</h2>
                
                {/* BOTÃO PARA ABRIR O CALENDÁRIO COMPLETO */}
                <button 
                    onClick={() => setShowCalendar(true)} 
                    style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: '1.8em' }}
                    title="Abrir Calendário Completo"
                >
                    <FaCalendarAlt />
                </button>
            </div>
            
            {/* Carrossel Semanal */}
            <div style={{ display: 'flex', overflowX: 'scroll', paddingBottom: '10px', gap: '10px' }}>
                {weekDays.map(day => {
                    const dayString = formatDateToISO(day.date);
                    const isSelected = dayString === selectedDateString;
                    const isToday = dayString === todayDateString;
                    
                    return (
                        <div 
                            key={dayString}
                            onClick={() => handleDateChange(day.date)}
                            style={{
                                ...cardStyle(isSelected),
                                flexShrink: 0, 
                                minWidth: '80px',
                                border: `2px solid ${isSelected ? primaryColor : '#ddd'}`,
                                backgroundColor: !isSelected && isToday ? '#fff8e1' : cardStyle(isSelected).backgroundColor
                            }}
                        >
                            <p style={{ margin: '0 0 5px 0' }}>{day.dayName.toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '1.2em' }}>{day.date.getDate()}</p>
                        </div>
                    );
                })}
            </div>
            
            {/* --- MODAL DO CALENDÁRIO COMPLETO --- */}
            {showCalendar && (
                <div style={overlayStyle} onClick={() => setShowCalendar(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px', color: primaryColor }}>Selecione a Data</h3>
                        <DatePicker 
                            selected={selectedDate}
                            onChange={handleDateChange} 
                            dateFormat="dd/MM/yyyy"
                            minDate={new Date()} 
                            inline 
                        />
                         <button 
                            onClick={() => setShowCalendar(false)} 
                            style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
            
            <hr style={{ margin: '30px 0' }}/>
            
            {/* --- 2. SELEÇÃO DE PROFISSIONAL --- */}
            <h2 style={{ color: primaryColor, fontSize: '1.4em', marginBottom: '15px' }}><FaUserCircle style={{ marginRight: '10px' }}/> 2. Selecione o Profissional</h2>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'scroll', paddingBottom: '10px' }}>
                {profissionais.map(barbeiro => (
                    <div 
                        key={barbeiro.id}
                        onClick={() => setSelectedBarbeiro(barbeiro)}
                        style={{
                            ...cardStyle(selectedBarbeiro?.id === barbeiro.id),
                            width: '100px', flexShrink: 0,
                            border: `3px solid ${selectedBarbeiro?.id === barbeiro.id ? accentColor : 'transparent'}`
                        }}
                    >
                        <img 
                            src={barbeiro.foto_url || 'https://placehold.co/80/eee/333?text=B'} 
                            alt={barbeiro.nome} 
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>{barbeiro.nome.split(' ')[0]}</p>
                    </div>
                ))}
            </div>
            
            <hr style={{ margin: '30px 0' }}/>
            
            {/* --- 3. HORÁRIOS DISPONÍVEIS --- */}
            <h2 style={{ color: primaryColor, fontSize: '1.4em', marginBottom: '15px' }}><FaClock style={{ marginRight: '10px' }}/> 3. Horários Disponíveis</h2>
            
            {loadingHorarios ? (
                 <div style={{ textAlign: 'center', padding: '20px', color: primaryColor }}><FaSpinner className="spinner" size={30}/> Calculando horários...</div>
            ) : horariosDisponiveis.length === 0 ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>{error || "Nenhum horário disponível para este dia e profissional. Tente outra data!"}</p>
            ) : (
                <div style={{ marginBottom: '30px' }}>
                    
                    {/* MANHÃ */}
                    {horariosManha.length > 0 && (
                        <>
                            <h4 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Manhã ({horariosManha.length} horários)</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {horariosManha.map(hora => (
                                    <button 
                                        key={hora}
                                        onClick={() => handleAgendar(hora)} // ABRE O MODAL
                                        style={{ padding: '10px 15px', backgroundColor: '#006400', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                    >
                                        <FaCheckCircle style={{ marginRight: '5px' }}/> {hora}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    
                    {/* TARDE */}
                    {horariosTarde.length > 0 && (
                        <>
                            <h4 style={{ borderTop: '1px dashed #ddd', paddingTop: '15px', marginTop: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Tarde ({horariosTarde.length} horários)</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {horariosTarde.map(hora => (
                                    <button 
                                        key={hora}
                                        onClick={() => handleAgendar(hora)} // ABRE O MODAL
                                        style={{ padding: '10px 15px', backgroundColor: '#006400', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                    >
                                        <FaCheckCircle style={{ marginRight: '5px' }}/> {hora}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {/* RENDERIZAÇÃO DO MODAL DE CONFIRMAÇÃO */}
            {tempAgendamentoData && (
                <ModalConfirmacao 
                    agendamentoData={tempAgendamentoData}
                    onClose={() => setTempAgendamentoData(null)}
                    onConfirm={handleFinalConfirm} // Passa a função que realmente faz o POST
                />
            )}
            
            {/* Estilo para o Spinner */}
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default SelecionarHorario;