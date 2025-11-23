// src/components/ControleCaixa/ModalExclusaoHorarios.jsx
import React from 'react';
import { FaTrashAlt, FaCalendarDay, FaCalendarWeek, FaTimes } from 'react-icons/fa';

// Definindo as cores localmente para evitar erros de importação
const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    ERROR: '#cc0000',
    SECONDARY_TEXT: '#888888',
};

// Função auxiliar (deve ser a mesma em GerenciarHorarios.jsx)
const getDayLabel = (value) => {
    const DIAS_SEMANA = [
        { value: 'domingo', label: 'Domingo' }, 
        { value: 'segunda', label: 'Segunda-feira' },
        { value: 'terca', label: 'Terça-feira' },
        { value: 'quarta', label: 'Quarta-feira' },
        { value: 'quinta', label: 'Quinta-feira' },
        { value: 'sexta', label: 'Sexta-feira' },
        { value: 'sabado', label: 'Sábado' },
    ];
    return DIAS_SEMANA.find(d => d.value === value)?.label || value;
};


const ModalExclusaoHorarios = ({ slot, onClose, onConfirm }) => {
    if (!slot) return null;

    const slotLabel = `${slot.hora_inicio} - ${slot.hora_fim}`;
    
    const deleteButtonStyle = (color) => ({
        padding: '10px 15px', 
        backgroundColor: color, 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        justifyContent: 'center'
    });

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '400px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <h3 style={{ borderBottom: `2px solid ${COLORS.ERROR}`, paddingBottom: '10px', color: COLORS.ERROR, textAlign: 'center' }}>
                    <FaTrashAlt style={{ marginRight: '10px' }} /> Excluir Horário
                </h3>
                
                <p style={{ textAlign: 'center', marginBottom: '20px' }}>O turno **{slotLabel}** na **{getDayLabel(slot.dia_semana)}** foi selecionado.</p>
                <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Quantos horários deseja excluir?</p>
                
                <hr style={{ margin: '20px 0' }}/>

                {/* Opção 1: Apenas o slot único (Cor Amarelo Dourado para o primeiro botão) */}
                <button 
                    onClick={() => onConfirm('single')}
                    style={deleteButtonStyle(COLORS.ACCENT)} 
                >
                    <FaTimes /> Apenas este slot ({slotLabel})
                </button>

                {/* Opção 2: Todos os slots com este turno no dia (dia da semana) */}
                <button 
                    onClick={() => onConfirm('day')}
                    style={deleteButtonStyle(COLORS.ERROR)}
                >
                    <FaCalendarDay /> Todos os turnos ({slotLabel}) na {getDayLabel(slot.dia_semana)}
                </button>

                {/* Opção 3: Excluir a semana toda com esse turno */}
                <button 
                    onClick={() => onConfirm('all-week')}
                    style={deleteButtonStyle('#800000')} // Vermelho Mais Escuro
                >
                    <FaCalendarWeek /> Todos os turnos ({slotLabel}) na semana
                </button>
                
                <button 
                    onClick={onClose}
                    style={{ padding: '10px 15px', backgroundColor: COLORS.SECONDARY_TEXT, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', marginTop: '10px' }}
                >
                    Cancelar
                </button>

            </div>
        </div>
    );
};

export default ModalExclusaoHorarios;