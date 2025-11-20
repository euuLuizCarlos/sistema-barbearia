// src/pages/GerenciarServicos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FaPlusCircle, FaEdit, FaTrashAlt, FaSave, FaTimesCircle, FaClipboardList } from 'react-icons/fa';
import { useUi } from '../contexts/UiContext';

const GerenciarServicos = () => {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [message, setMessage] = useState('');
    
    // Estado para o formulário (Criação/Edição)
    const [form, setForm] = useState({
        id: null,
        nome: '',
        preco: '',
        duracao_minutos: '30' // Padrão de 30 minutos
    });

    const isEditing = form.id !== null;

    // --- FUNÇÕES DE LÓGICA ---

    const fetchServicos = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            // Rota GET /servicos/meus
            const response = await api.get('/servicos/meus');
            setServicos(response.data);
        } catch (error) {
            setApiError('Erro ao carregar serviços.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServicos();
    }, [fetchServicos]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (servico) => {
        // Preenche o formulário com os dados do serviço para edição
        setForm({
            id: servico.id,
            nome: servico.nome,
            // Certifique-se de que o preço é uma string de duas casas decimais
            preco: String(servico.preco).includes('.') ? servico.preco : `${servico.preco}.00`, 
            duracao_minutos: String(servico.duracao_minutos)
        });
        setMessage('');
        setApiError('');
    };

    const handleClearForm = () => {
        setForm({ id: null, nome: '', preco: '', duracao_minutos: '30' });
        setMessage('');
        setApiError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(isEditing ? 'Atualizando serviço...' : 'Criando serviço...');
        setApiError('');

        // 1. Validação básica
        if (!form.nome || !form.preco || !form.duracao_minutos) {
            setApiError('Preencha todos os campos obrigatórios.');
            setMessage('');
            return;
        }

        // 2. Preparação dos dados
        const dadosParaEnviar = {
            nome: form.nome,
            preco: parseFloat(form.preco), // Envia como número
            duracao_minutos: parseInt(form.duracao_minutos)
        };

        try {
            let response;
            if (isEditing) {
                // Rota PUT para atualização
                response = await api.put(`/servicos/${form.id}`, dadosParaEnviar);
            } else {
                // Rota POST para criação
                response = await api.post('/servicos', dadosParaEnviar);
            }

            setMessage(response.data.message);
            handleClearForm(); // Limpa o formulário
            fetchServicos(); // Recarrega a lista
            
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Erro ao salvar o serviço.';
            setApiError(errorMsg);
            console.error('Erro no CRUD de serviços:', error);
        }
    };

    const ui = useUi();

    const handleDelete = async (id) => {
        const ok = await ui.confirm('Tem certeza que deseja DELETAR este serviço?');
        if (!ok) return;

        setMessage('Deletando serviço...');
        setApiError('');
        try {
            // Rota DELETE
            const response = await api.delete(`/servicos/${id}`);
            setMessage(response.data.message);
            ui.showPostIt('Serviço deletado com sucesso.', 'success');
            fetchServicos();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Erro ao deletar o serviço.';
            setApiError(errorMsg);
            ui.showPostIt('Erro ao deletar o serviço.', 'error');
            console.error('Erro ao deletar:', error);
        }
    };
    
    // --- ESTILOS INLINE (Mantenha o padrão) ---
    const cardStyle = {
        maxWidth: '1000px', margin: '30px auto', padding: '20px', 
        backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    };
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const buttonStyle = (color) => ({
        padding: '8px 15px', backgroundColor: color, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
    });
    const tableHeaderStyle = { backgroundColor: '#023047', color: 'white', padding: '10px' };

    return (
        <div style={cardStyle}>
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047' }}>
                <FaClipboardList style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                Gerenciar Meus Serviços
            </h1>
            
            {/* Mensagens de feedback */}
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {apiError && <div style={{ color: 'red', marginBottom: '15px' }}>{apiError}</div>}

            {/* --- BLOCO DE CADASTRO/EDIÇÃO --- */}
            <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h3 style={{ color: '#023047', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                    {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: '20px' }}>
                    
                    {/* Campo Nome */}
                    <div>
                        <label>NOME DO SERVIÇO *</label>
                        <input type="text" name="nome" value={form.nome} onChange={handleChange} style={inputStyle} required />
                    </div>

                    {/* Campo Preço */}
                    <div>
                        <label>Preço (R$) *</label>
                        <input 
                            type="number" 
                            name="preco" 
                            value={form.preco} 
                            onChange={handleChange} 
                            style={inputStyle} 
                            step="0.01" 
                            required 
                        />
                    </div>

                    {/* Campo Duração */}
                    <div>
                        <label>Duração (Minutos) *</label>
                        <select name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange} style={inputStyle} required>
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min (1h)</option>
                            <option value="90">90 min (1h 30)</option>
                            <option value="120">120 min (2h)</option>
                        </select>
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ paddingTop: '30px', display: 'flex', gap: '10px' }}>
                        <button type="submit" style={buttonStyle('#023047')}>
                            <FaSave style={{ marginRight: '5px' }} />
                            {isEditing ? 'Salvar Edição' : 'Adicionar Serviço'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={handleClearForm} style={buttonStyle('#ccc')}>
                                <FaTimesCircle style={{ marginRight: '5px' }} />
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>


            {/* --- BLOCO DE LISTAGEM --- */}
            <h2 style={{ color: '#023047', marginBottom: '20px' }}>Serviços Cadastrados</h2>
            
            {loading ? (
                <p>Carregando serviços...</p>
            ) : servicos.length === 0 ? (
                <p>Nenhum serviço cadastrado. Use o formulário acima para começar!</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '5px', overflow: 'hidden' }}>
                    <thead>
                        <tr>
                            <th style={tableHeaderStyle}>SERVIÇO</th>
                            <th style={tableHeaderStyle}>PREÇO</th>
                            <th style={tableHeaderStyle}>DURAÇÃO</th>
                            <th style={tableHeaderStyle}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicos.map((servico) => (
                            <tr key={servico.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', textAlign: 'left' }}>{servico.nome}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>R$ {parseFloat(servico.preco).toFixed(2).replace('.', ',')}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{servico.duracao_minutos} min</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button onClick={() => handleEdit(servico)} style={{ ...buttonStyle('#FFB703'), marginRight: '10px' }}>
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDelete(servico.id)} style={buttonStyle('#D62828')}>
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default GerenciarServicos;