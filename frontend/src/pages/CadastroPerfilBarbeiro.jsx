// src/pages/CadastroPerfilBarbeiro.jsx (CÓDIGO FINAL COM ESTILO PROFISSIONAL)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UFs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const CadastroPerfilBarbeiro = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.userId; // Pega o ID do usuário logado
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        nome_barbeiro: user?.userName || '', // Pré-preenche o nome do barbeiro
        nome_barbearia: '',
        documento: '', // CPF/CNPJ
        telefone: '',
        rua: '',
        numero: '',
        bairro: '',
        complemento: '',
        cep: '',
        uf: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Salvando informações do perfil...');

        // Validação básica de campos obrigatórios
        if (!formData.nome_barbeiro || !formData.nome_barbearia || !formData.documento || !formData.telefone || !formData.rua || !formData.numero || !formData.bairro || !formData.cep || !formData.uf) {
            setMessage('Por favor, preencha todos os campos obrigatórios (marcados com *).');
            setLoading(false);
            return;
        }

        try {
            // Chamada POST para a rota /perfil/barbeiro
            await api.post('/perfil/barbeiro', { ...formData, barbeiro_id: userId });

            setMessage('Perfil profissional salvo com sucesso! Redirecionando...');
            
            // Redireciona para a página principal após o cadastro
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Erro ao salvar perfil. Tente novamente.';
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- ESTILOS DE LAYOUT ---
    const containerStyle = {
        padding: '20px',
        maxWidth: '800px',
        margin: '50px auto',
        backgroundColor: '#fff', // Fundo Principal
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        color: '#333',
    };

    const quadroAzulStyle = {
        backgroundColor: '#023047', // Seu Azul Marinho Principal
        color: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        marginBottom: '30px',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        margin: '8px 0',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff',
        color: '#333',
    };

    const buttonStyle = {
        padding: '12px 20px',
        backgroundColor: '#FFB703', // Dourado de Destaque
        color: '#023047',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1em',
        marginTop: '20px',
        transition: 'background-color 0.3s',
        opacity: loading ? 0.7 : 1,
        width: '100%'
    };
    
    const columnLayout = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '10px',
    };


    return (
        <div style={containerStyle}>
            <div style={quadroAzulStyle}>
                <h2 style={{ margin: 0, color: '#FFB703' }}>Cadastro de Perfil Profissional</h2>
                <p style={{ color: '#ccc', fontSize: '0.9em' }}>Por favor, preencha para liberar o acesso a rede de buscas.</p>
                <p style={{ color: '#FFB703', fontWeight: 'bold', marginTop: '10px' }}>Seu ID de Barbeiro: {userId}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '0 30px' }}>
                <div style={columnLayout}>
                    {/* COLUNA 1 - Informações Pessoais */}
                    <div>
                        <label>Nome do Barbeiro *</label>
                        <input type="text" name="nome_barbeiro" value={formData.nome_barbeiro} onChange={handleChange} style={inputStyle} required />

                        <label>Nome da Barbearia *</label>
                        <input type="text" name="nome_barbearia" value={formData.nome_barbearia} onChange={handleChange} style={inputStyle} required />

                        <label>CPF/CNPJ *</label>
                        <input type="text" name="documento" value={formData.documento} onChange={handleChange} style={inputStyle} required />

                        <label>Telefone *</label>
                        <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} style={inputStyle} required />
                    </div>

                    {/* COLUNA 2 - Endereço */}
                    <div>
                        <label>CEP *</label>
                        <input type="text" name="cep" value={formData.cep} onChange={handleChange} style={inputStyle} required />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label>UF *</label>
                                <select name="uf" value={formData.uf} onChange={handleChange} style={inputStyle} required>
                                    <option value="">Selecione</option>
                                    {UFs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 2 }}>
                                <label>Rua *</label>
                                <input type="text" name="rua" value={formData.rua} onChange={handleChange} style={inputStyle} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Número *</label>
                                <input type="text" name="numero" value={formData.numero} onChange={handleChange} style={inputStyle} required />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label>Bairro *</label>
                                <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} style={inputStyle} required />
                            </div>
                        </div>

                        <label>Complemento (Opcional)</label>
                        <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>

                <button type="submit" style={buttonStyle} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Perfil e Acessar Painel'}
                </button>
            </form>

            {message && (
                <p style={{ marginTop: '20px', color: message.includes('sucesso') ? 'green' : 'red', fontWeight: 'bold', textAlign: 'center' }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default CadastroPerfilBarbeiro;