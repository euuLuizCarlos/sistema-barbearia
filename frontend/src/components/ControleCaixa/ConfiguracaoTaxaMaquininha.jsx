// src/components/ControleCaixa/ConfiguracaoTaxaMaquininha.jsx (CÓDIGO FINAL E COMPLETO)
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ConfiguracaoTaxaMaquininha = () => {
    // Mantemos como string no useState para sincronizar com o input
    const [taxa, setTaxa] = useState(0.00); 
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

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
        setMessage('Atualizando...'); // Inicia o loading visual
        
        const taxaNumerica = parseFloat(taxa);

        if (isNaN(taxaNumerica) || taxaNumerica < 0) {
            setMessage('Por favor, insira uma taxa percentual válida (número positivo).');
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
            const errorMessage = error.response?.data?.error || 'Erro ao salvar. Verifique o console para mais detalhes.';
            setMessage(errorMessage);
        }
        
        // CORREÇÃO UX: Limpa a mensagem após 3 segundos para que a tela volte ao normal
        setTimeout(() => {
            setMessage('');
        }, 3000); 
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

    const buttonStyle = {
        padding: '10px 20px',
        fontSize: '1em',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    };

    if (loading) {
        return <p>Carregando configuração de taxa...</p>;
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '600px', margin: '20px auto' }}>
            <h2>Configuração da Taxa da Maquininha</h2>
            <p>Defina o percentual de taxa cobrado pela sua operadora de cartão. <br/>
            **Taxa Atual: <span style={{fontWeight: 'bold', color: 'green'}}>{Number(taxa).toFixed(2)}%</span>**</p>

            <form onSubmit={handleUpdate} style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Nova Taxa (%):
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            // O value precisa de uma string, mas o estado pode ser number. String(taxa) garante
                            value={String(taxa)} 
                            onChange={(e) => setTaxa(e.target.value)}
                            style={inputStyle}
                            required
                        />
                        <span style={{ fontSize: '1.2em' }}>%</span>
                    </div>
                </label>

                <button type="submit" style={buttonStyle}>
                    Salvar Nova Taxa
                </button>
            </form>
            
            {message && <p style={{ marginTop: '15px', color: message.includes('sucesso') ? 'green' : 'red' }}>{message}</p>}
        </div>
    );
};

export default ConfiguracaoTaxaMaquininha;