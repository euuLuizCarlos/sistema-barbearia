// src/components/ControleCaixa/ModalDesativarDia.jsx
import React from 'react';
import { FaTrashAlt, FaCalendarTimes, FaTimes } from 'react-icons/fa';

const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    ERROR: '#cc0000',
    SECONDARY_TEXT: '#888888',
};

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

const ModalDesativarDia = ({ dia_semana, horarios_count, onClose, onConfirm }) => {
    if (!dia_semana) return null;

    const buttonStyle = (color) => ({
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
            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '450px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <h3 style={{ borderBottom: `2px solid ${COLORS.ERROR}`, paddingBottom: '10px', color: COLORS.ERROR, textAlign: 'center' }}>
                    <FaCalendarTimes style={{ marginRight: '10px' }} /> Desativar Dia
                </h3>
                
                <p style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.1em' }}>
                    Desativar <strong>{getDayLabel(dia_semana)}</strong>?
                </p>
                
                <p style={{ textAlign: 'center', color: COLORS.SECONDARY_TEXT, marginBottom: '20px' }}>
                    Serão removidos <strong>{horarios_count} horário(s)</strong> deste dia.
                </p>

                <div style={{ backgroundColor: '#fff0f0', border: `2px solid ${COLORS.ERROR}`, borderRadius: '5px', padding: '15px', marginBottom: '20px' }}>
                    <p style={{ margin: 0, color: COLORS.ERROR, fontSize: '0.95em' }}>
                        ⚠️ <strong>Atenção:</strong> Esta ação removerá TODOS os horários de <strong>{getDayLabel(dia_semana)}</strong>, 
                        deixando o dia com status de "FECHADO". Os outros dias não serão afetados.
                    </p>
                </div>

                <hr style={{ margin: '20px 0' }}/>

                {/* Botão de Confirmação */}
                <button 
                    onClick={() => onConfirm()}
                    style={buttonStyle(COLORS.ERROR)}
                >
                    <FaTrashAlt /> Desativar {getDayLabel(dia_semana)} Completamente
                </button>

                {/* Botão de Cancelar */}
                <button 
                    onClick={onClose}
                    style={{ ...buttonStyle(COLORS.SECONDARY_TEXT), marginBottom: 0 }}
                >
                    <FaTimes /> Cancelar
                </button>
            </div>
        </div>
    );
};

export default ModalDesativarDia;
