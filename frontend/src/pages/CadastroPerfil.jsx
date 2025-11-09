// src/pages/CadastroPerfil.jsx (CÓDIGO COMPLETO ATUALIZADO)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import axios from 'axios'; 
import { useAuth } from '../contexts/AuthContext';
// Importação dos ícones FaHome e FaTimesCircle
import { FaSave, FaTimesCircle, FaUserCog, FaHome } from 'react-icons/fa'; 

// --- FUNÇÕES DE MÁSCARA, VALIDAÇÃO E UFS (Mantenha ou importe) ---
const UFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const maskCep = (value) => { 
    if (!value) return ""; 
    value = value.toString().replace(/\D/g, "").substring(0, 8); 
    if (value.length > 5) { 
        value = value.replace(/^(\d{5})(\d)/, "$1-$2"); 
    } 
    return value; 
};

const maskCpfCnpj = (value) => { 
    if (!value) return ""; 
    value = value.toString().replace(/\D/g, "");
    
    if (value.length <= 11) { // CPF
        value = value.replace(/(\d{3})(\d)/, "$1.$2")
                     .replace(/(\d{3})(\d)/, "$1.$2")
                     .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else { // CNPJ
        value = value.substring(0, 14);
        value = value.replace(/^(\d{2})(\d)/, "$1.$2")
                     .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                     .replace(/\.(\d{3})(\d)/, ".$1/$2")
                     .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value; 
};

const validateCep = (cep) => /^\d{5}-?\d{3}$/.test(cep);
const validateCpfCnpj = (doc) => { 
    const cleaned = doc.toString().replace(/\D/g, ''); 
    return cleaned.length === 11 || cleaned.length === 14; 
};


const CadastroPerfil = () => {
    const navigate = useNavigate();
    const { user, userType } = useAuth(); 
    
    const [formData, setFormData] = useState({});         
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [apiError, setApiError] = useState(''); 
    const [validationErrors, setValidationErrors] = useState({});
    const [isEditingExisting, setIsEditingExisting] = useState(false); 

    // --- FUNÇÃO DE BUSCA (Para pré-preencher em caso de EDIÇÃO) ---
    const fetchProfileForEditing = useCallback(async () => {
        if (userType !== 'barbeiro') {
            if (userType === 'cliente') { setLoading(false); return; }
        }
        setLoading(true);
        try {
            const response = await api.get('/perfil/barbeiro');
            const { profileExists, data } = response.data;

            if (profileExists && data) {
                // MODO EDIÇÃO
                data.documento = maskCpfCnpj(data.documento);
                data.cep = maskCep(data.cep);
                setFormData(data);
                setIsEditingExisting(true); 
            } else {
                // MODO CADASTRO
                setFormData({
                    nome_barbeiro: user?.userName || '', nome_barbearia: '', documento: '', telefone: '', rua: '', numero: '', bairro: '', complemento: '', cep: '', uf: '', localidade: ''
                });
                setIsEditingExisting(false);
            }
        } catch (err) {
            setApiError("Erro ao carregar dados. Preencha manualmente.");
        } finally {
            setLoading(false);
        }
    }, [user, userType]); 

    useEffect(() => {
        fetchProfileForEditing();
    }, [fetchProfileForEditing]); 
    
    // --- FUNÇÕES DE EVENTO ---

    const checkCep = async (cep) => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;
        setMessage('Buscando endereço...');
        setApiError('');
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = response.data;
            if (data.erro) { setApiError('CEP não encontrado. Preencha manualmente.'); setMessage(''); return; }
            setFormData(prev => ({
                ...prev, rua: data.logradouro || '', bairro: data.bairro || '', uf: data.uf || '', localidade: data.localidade || '',
            }));
            setMessage('Endereço preenchido automaticamente.');
        } catch (error) { setApiError('Erro ao consultar CEP.'); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === 'documento') newValue = maskCpfCnpj(value);
        if (name === 'cep') { newValue = maskCep(value); if (newValue.length === 9) checkCep(newValue); }
        setFormData({ ...formData, [name]: newValue });
        if (apiError) setApiError('');
        if (validationErrors[name]) { setValidationErrors(prev => ({ ...prev, [name]: null })); }
    };
    
    // --- SUBMISSÃO DO FORMULÁRIO ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('Salvando alterações...');
        setApiError(''); 
        setValidationErrors({});
        
        // Validação Final no Frontend
        const requiredFields = ['nome_barbearia', 'telefone', 'rua', 'numero', 'bairro', 'cep', 'uf', 'localidade', 'nome_barbeiro', 'documento'];
        const hasRequiredErrors = requiredFields.some(field => !formData[field]);

        if (!validateCpfCnpj(formData.documento) || !validateCep(formData.cep) || hasRequiredErrors) {
             setApiError('Preencha todos os campos obrigatórios e corrija o CEP/CPF/CNPJ.');
             return;
        }

        try {
            // 1. PREPARAÇÃO DOS DADOS LIMPOS
            const dadosParaEnviar = {
                ...formData,
                documento: formData.documento.replace(/\D/g, ''), 
                cep: formData.cep.replace(/\D/g, ''), 
            };
            
            await api.post('/perfil/barbeiro', dadosParaEnviar); 
            
            setMessage('Perfil salvo com sucesso! Redirecionando...');

            // REDIRECIONAMENTO CRÍTICO: Após salvar, volta para a tela de Detalhes
            setTimeout(() => {
                navigate('/meu-perfil', { replace: true });
            }, 500); 

        } catch (err) {
            let apiErrorMessage = err.response?.data?.error || 'Erro ao atualizar. Verifique sua conexão.';
            setApiError(apiErrorMessage);
        }
    };
    
    // --- RENDERIZAÇÃO ---
    if (loading) { return <h2 style={{ padding: '50px', textAlign: 'center' }}>Carregando formulário...</h2>; }
    
    // Estilos internos...
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const errorStyle = { color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' };
    const disabledInputStyle = { ...inputStyle, backgroundColor: '#eee', cursor: 'not-allowed' };
    const columnLayout = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' };


    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047', position: 'relative' }}>
                <FaUserCog style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                {isEditingExisting ? 'Edição de Perfil' : 'Cadastro Inicial de Perfil Profissional *'}

                {/* BOTÃO VOLTAR AO DASHBOARD (NOVO) */}
                <button 
                    type="button" 
                    onClick={() => navigate('/', { replace: true })} 
                    style={{ 
                        position: 'absolute', 
                        right: '0', 
                        top: '0',
                        padding: '8px 15px', 
                        backgroundColor: '#555', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    <FaHome style={{ marginRight: '5px' }} /> Dashboard
                </button>
            </h1>
            
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {apiError && <div style={{ color: 'red', marginBottom: '15px' }}>{apiError}</div>}
            
            <form onSubmit={handleUpdate} style={{ padding: '0 30px' }}>
                <div style={columnLayout}>
                    
                    {/* COLUNA ESQUERDA */}
                    <div>
                        <label>Nome do Barbeiro</label>
                        <input type="text" name="nome_barbeiro" value={formData.nome_barbeiro || ''} onChange={handleChange} style={disabledInputStyle} disabled={true} />
                        
                        <label>CPF/CNPJ *</label>
                        <input 
                            type="text" 
                            name="documento" 
                            value={formData.documento || ''} 
                            onChange={handleChange} 
                            style={isEditingExisting ? disabledInputStyle : inputStyle}
                            disabled={isEditingExisting}
                            required 
                        />
                        {validationErrors.documento && <div style={errorStyle}>{validationErrors.documento}</div>}

                        <label>Nome da Barbearia *</label>
                        <input type="text" name="nome_barbearia" value={formData.nome_barbearia || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.nome_barbearia && <div style={errorStyle}>{validationErrors.nome_barbearia}</div>}

                        <label>Telefone *</label>
                        <input type="text" name="telefone" value={formData.telefone || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.telefone && <div style={errorStyle}>{validationErrors.telefone}</div>}

                        <label>CEP *</label>
                        <input type="text" name="cep" value={formData.cep || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.cep && <div style={errorStyle}>{validationErrors.cep}</div>}
                        
                    </div>

                    {/* COLUNA DIREITA (Endereço) */}
                    <div>
                        <label>Rua *</label>
                        <input type="text" name="rua" value={formData.rua || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.rua && <div style={errorStyle}>{validationErrors.rua}</div>}

                        <label>Número *</label>
                        <input type="text" name="numero" value={formData.numero || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.numero && <div style={errorStyle}>{validationErrors.numero}</div>}

                        <label>Bairro *</label>
                        <input type="text" name="bairro" value={formData.bairro || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.bairro && <div style={errorStyle}>{validationErrors.bairro}</div>}

                        <label>Cidade *</label>
                        <input type="text" name="localidade" value={formData.localidade || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.localidade && <div style={errorStyle}>{validationErrors.localidade}</div>}
                        
                        <label>UF *</label>
                        <select name="uf" value={formData.uf || ''} onChange={handleChange} style={inputStyle} required>
    <option value="">Selecione a UF</option>

    {/* Procure por qualquer outra linha de map aqui! */}

    {UFs.map(uf => <option key={uf} value={uf}>{uf}</option>)} 
</select>
                        {validationErrors.uf && <div style={errorStyle}>{validationErrors.uf}</div>}
                        
                        <label>Complemento (Opcional)</label>
                        <input type="text" name="complemento" value={formData.complemento || ''} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button type="submit" style={{ padding: '12px 30px', backgroundColor: '#023047', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '15px' }}>
                        <FaSave style={{ marginRight: '10px' }} />
                        Salvar Alterações
                    </button>
                    
                    {/* Botão de Cancelar: Aparece se for Edição (Volta para a tela de Detalhes) */}
                    {isEditingExisting && (
                        <button type="button" onClick={() => navigate('/meu-perfil', { replace: true })} style={{ padding: '12px 30px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            <FaTimesCircle style={{ marginRight: '10px' }} />
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CadastroPerfil;