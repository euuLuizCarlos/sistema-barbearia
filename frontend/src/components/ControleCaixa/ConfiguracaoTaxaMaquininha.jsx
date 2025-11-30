// src/components/ControleCaixa/ConfiguracaoTaxaMaquininha.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaCreditCard, FaSync, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

// Definindo cores localmente para evitar erros de importação
const PRIMARY_COLOR = '#023047';
const ACCENT_COLOR = '#FFB703';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#cc0000';
const BACKGROUND_LIGHT = '#f5f5f5';


// O componente agora recebe 'onCancel' para fechar/voltar
const ConfiguracaoTaxaMaquininha = ({ onCancel }) => { 
    // Mantemos como string no useState para sincronizar com o input
    const [taxa, setTaxa] = useState(0.00); 
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // 1. Busca a taxa atual ao carregar o componente
        const fetchTaxa = async () => {
            try {
                const response = await api.get('/taxa-cartao');
                // Buscamos e guardamos o valor (pode vir como string do banco)
                setTaxa(response.data.taxa || 0.00); 
            } catch (error) {
                console.error("Erro ao buscar taxa:", error);
                setMessage('Erro ao carregar a taxa atual. Verifique o console.');
            } finally {
                setLoading(false);
            }
        };
        fetchTaxa();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('Atualizando...'); 
        setIsSaving(true);
        
        const taxaNumerica = parseFloat(taxa);

        if (isNaN(taxaNumerica) || taxaNumerica < 0 || taxaNumerica > 100) {
            setMessage('Por favor, insira uma taxa percentual válida (0 a 100).');
            setIsSaving(false);
            return;
        }

        try {
            // 2. Envia a taxa atualizada para a API (Endpoint PUT)
            const response = await api.put('/taxa-cartao', { taxa: taxaNumerica });
            
            // SUCESSO: Atualiza o estado visualmente e define a mensagem de sucesso
            setTaxa(taxaNumerica); 
            setMessage(response.data.message || `Taxa atualizada para ${taxaNumerica.toFixed(2)}% com sucesso!`);
            
        } catch (error) {
            console.error("Erro ao atualizar taxa:", error);
            const errorMessage = error.response?.data?.error || 'Erro ao salvar. Tente novamente.';
            setMessage(errorMessage);
        } finally {
            setIsSaving(false);
            // Limpa a mensagem após 4 segundos
            setTimeout(() => setMessage(''), 4000); 
        }
    };

    // --- ESTILOS INLINE ---
    const inputStyle = {
        padding: '10px',
        fontSize: '1em',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '150px',
        marginRight: '10px'
    };

    const buttonStyle = (color) => ({
        padding: '10px 20px',
        fontSize: '1em',
        backgroundColor: color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    });
    
    // Estilo do contêiner seguindo o padrão GerenciarDiasBloqueados
    const containerStyle = { 
        padding: '30px', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        maxWidth: '600px', 
        margin: '20px 0',
        backgroundColor: '#fff',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        borderTop: `5px solid ${ACCENT_COLOR}`, // Detalhe de destaque
        position: 'relative'
    };


    if (loading) {
        return <div style={containerStyle}><FaSpinner className="spinner" /> Carregando configuração de taxa...</div>;
    }

    return (
        <div style={containerStyle}>
            
            {/* TÍTULO E BOTÃO DE FECHAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: PRIMARY_COLOR }}>
                    <FaCreditCard style={{ marginRight: '10px' }} /> Configuração da Taxa da Maquininha
                </h2>
                {/* 🚨 BOTÃO DE FECHAR/VOLTAR (NOVO) 🚨 */}
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY_COLOR }} disabled={isSaving}>
                    <FaTimes size={24} />
                </button>
            </div>


            <p>Defina o percentual de taxa cobrado pela sua operadora de cartão. <br/>
            **Taxa Atual: <span style={{fontWeight: 'bold', color: SUCCESS_COLOR}}>{Number(taxa).toFixed(2)}%</span>**</p>
            
            {message && <p style={{ color: message.includes('sucesso') ? SUCCESS_COLOR : ERROR_COLOR, marginBottom: '15px', fontWeight: 'bold' }}>{message}</p>}


            <form onSubmit={handleUpdate} style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Nova Taxa (%):
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            // Garante que o input receba a taxa como string, mas formatado para 2 casas
                            value={String(Number(taxa).toFixed(2))} 
                            onChange={(e) => setTaxa(e.target.value)}
                            style={inputStyle}
                            required
                            disabled={isSaving}
                        />
                        <span style={{ fontSize: '1.2em' }}>%</span>
                    </div>
                </label>

                <button type="submit" style={buttonStyle(PRIMARY_COLOR)} disabled={isSaving}>
                    {isSaving ? <FaSpinner className="spinner" /> : <FaSave />} Salvar Nova Taxa
                </button>
            </form>
            
            {/* 💡 BOTÃO PRINCIPAL DE VOLTAR (Para fechar o painel) */}
            <button 
                onClick={onCancel} 
                style={{ ...buttonStyle(BACKGROUND_LIGHT), color: '#333', marginTop: '30px', width: '100%', border: '1px solid #ccc' }}
                disabled={isSaving}
            >
                <FaTimes /> Fechar Painel
            </button>
            
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default ConfiguracaoTaxaMaquininha;