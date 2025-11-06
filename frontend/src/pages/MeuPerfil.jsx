// src/pages/MeuPerfil.jsx (CÓDIGO FINAL E COMPLETO: VISUALIZAÇÃO, EDIÇÃO E CADASTRO INICIAL)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import axios from 'axios'; 
import { useAuth } from '../contexts/AuthContext';
import { FaSave, FaEdit, FaTimesCircle, FaUserCog } from 'react-icons/fa';

// --- FUNÇÕES DE MÁSCARA E VALIDAÇÃO (INCLUÍDAS PARA GARANTIR ESTABILIDADE) ---

// Lista de UFs (Usada no Select)
const UFs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Máscara de CEP: 99999-999
const maskCep = (value) => { 
    if (!value) return ""; 
    value = value.toString().replace(/\D/g, "").substring(0, 8); 
    if (value.length > 5) { 
        value = value.replace(/^(\d{5})(\d)/, "$1-$2"); 
    } 
    return value; 
};

// Máscara de CPF (11 dígitos) / CNPJ (14 dígitos)
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

// Validação simples de CEP
const validateCep = (cep) => /^\d{5}-?\d{3}$/.test(cep);

// Validação simples de CPF/CNPJ
const validateCpfCnpj = (doc) => { 
    const cleaned = doc.toString().replace(/\D/g, ''); 
    return cleaned.length === 11 || cleaned.length === 14; 
};

// --- COMPONENTE PRINCIPAL ---

const MeuPerfil = () => {
    const navigate = useNavigate();
    const { user, userType, isAuthenticated } = useAuth(); 
    const userId = user?.userId; 
    
    // ESTADOS
    const [profileData, setProfileData] = useState(null); // Dados carregados do DB
    const [formData, setFormData] = useState({});         // Dados usados no formulário (edição/cadastro)
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);     // Controla se está no modo Edição
    const [apiError, setApiError] = useState(''); 
    const [validationErrors, setValidationErrors] = useState({});

    // --- 1. FUNÇÃO DE BUSCA DO PERFIL (GET) ---
    const fetchProfile = useCallback(async () => {
        // Redireciona se não for barbeiro ou não autenticado (Segurança)
        if (!isAuthenticated || userType !== 'barbeiro') {
             setLoading(false);
             return;
        }

        setLoading(true);
        try {
            const response = await api.get('/perfil/barbeiro');
            if (response.data.profileExists && response.data.data) {
                const data = response.data.data;
                
                // Aplica máscara APENAS nos dados que vieram do banco (para exibição/edição)
                data.documento = maskCpfCnpj(data.documento); 
                data.cep = maskCep(data.cep); 
                
                setProfileData(data); 
                setFormData(data);    
                setIsEditing(false); // Perfil existe: Modo VISUALIZAÇÃO
            } else {
                // Perfil NÃO existe: FORÇA o modo EDIÇÃO (para cadastro inicial)
                setIsEditing(true); 
                // Pré-preenche o nome do Barbeiro do token e o ID
                setFormData({
                    nome_barbeiro: user?.userName || '',
                    documento: '', telefone: '', nome_barbearia: '', rua: '', numero: '', bairro: '', complemento: '', cep: '', uf: '', localidade: ''
                }); 
            }
        } catch (err) {
            setApiError("Erro ao carregar os dados do perfil.");
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userType, navigate, user?.userName]); 

    // Efeito para disparar a busca quando autenticado
    useEffect(() => {
        if (isAuthenticated) { 
            fetchProfile();
        }
    }, [isAuthenticated, fetchProfile]); 
    
    // --- FUNÇÕES DE EVENTO ---

    // Consulta CEP na API ViaCEP
    const checkCep = async (cep) => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;

        setMessage('Buscando endereço...');
        setApiError('');
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = response.data;

            if (data.erro) {
                setApiError('CEP não encontrado. Preencha manualmente.');
                setMessage('');
                return;
            }

            setFormData(prev => ({
                ...prev,
                rua: data.logradouro || '',
                bairro: data.bairro || '',
                uf: data.uf || '',
                localidade: data.localidade || '',
            }));
            setMessage('Endereço preenchido automaticamente.');
        } catch (error) {
            setApiError('Erro ao consultar CEP.');
        }
    };

    // Atualiza o estado do formulário e aplica máscaras
    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'documento') newValue = maskCpfCnpj(value);
        if (name === 'cep') {
            newValue = maskCep(value);
            if (newValue.length === 9) checkCep(newValue);
        }
        
        setFormData({ ...formData, [name]: newValue });
        if (apiError) setApiError('');
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Submissão do Formulário (POST para CREATE/UPDATE)
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('Salvando alterações...');
        setApiError(''); 
        setValidationErrors({});

        // 1. Validação de Campos
        let errors = {};
        const requiredFields = ['nome_barbearia', 'telefone', 'rua', 'numero', 'bairro', 'cep', 'uf', 'localidade', 'nome_barbeiro', 'documento'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors[field] = 'Campo obrigatório.';
            }
        });

        if (!validateCpfCnpj(formData.documento)) {
            errors.documento = 'CPF/CNPJ inválido.';
        }
        if (!validateCep(formData.cep)) {
            errors.cep = 'CEP inválido.';
        }
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setApiError('Corrija os erros no formulário antes de salvar.');
            setMessage('');
            return;
        }
        
        // 2. Envio para o Backend
        try {
            // Remove a máscara antes de enviar para o DB
            const dadosParaEnviar = {
                ...formData,
                documento: formData.documento.replace(/\D/g, ''), 
                cep: formData.cep.replace(/\D/g, ''), 
                // barbeiro_id já é enviado automaticamente pelo authenticateToken no backend
            };

            await api.post('/perfil/barbeiro', dadosParaEnviar); 
            
            setMessage('Perfil atualizado com sucesso!');
            setIsEditing(false); // Volta para visualização
            fetchProfile(); // Recarrega os dados

        } catch (err) {
            const apiMessage = err.response?.data?.error || 'Erro ao atualizar. Verifique a conexão.';
            setApiError(apiMessage);
        }
    };
    
    // --- ESTILOS ---
    const baseStyle = { color: '#333', padding: '10px 0', borderBottom: '1px dotted #ccc' };
    const labelStyle = { fontWeight: 'bold', display: 'block', marginBottom: '5px' };
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const errorStyle = { color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' };
    const disabledInputStyle = { ...inputStyle, backgroundColor: '#eee', cursor: 'not-allowed' };
    const columnLayout = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' };


    if (loading) {
        return <h2 style={{ padding: '50px', textAlign: 'center' }}>Verificando dados do perfil...</h2>;
    }
    
    // VARIÁVEL CHAVE DE RENDERIZAÇÃO: True se estiver editando OU se não houver dados.
    const shouldRenderForm = isEditing || !profileData; 


    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047' }}>
                <FaUserCog style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                Meu Perfil Profissional
            </h1>

            {/* Mensagens e Erros */}
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {apiError && <div style={{ color: 'red', marginBottom: '15px' }}>{apiError}</div>}

            {/* 1. MODO VISUALIZAÇÃO: RENDERIZA SÓ SE NÃO FOR CADASTRO INICIAL E NÃO ESTIVER EDITANDO */}
            {!shouldRenderForm && profileData && (
                // ------------------ MODO DE VISUALIZAÇÃO ------------------
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    
                    {/* DADOS PESSOAIS (VISUALIZAÇÃO) */}
                    <div>
                        <h3 style={{ color: '#023047', borderBottom: '1px solid #FFB703', paddingBottom: '5px' }}>Informações Básicas</h3>
                        <div style={baseStyle}><span style={labelStyle}>Nome do Barbeiro:</span> {profileData.nome_barbeiro}</div>
                        <div style={baseStyle}><span style={labelStyle}>Nome da Barbearia:</span> {profileData.nome_barbearia}</div>
                        <div style={baseStyle}><span style={labelStyle}>Documento (CPF/CNPJ):</span> {profileData.documento}</div>
                        <div style={baseStyle}><span style={labelStyle}>Telefone:</span> {profileData.telefone}</div>
                    </div>

                    {/* DADOS DE ENDEREÇO (VISUALIZAÇÃO) */}
                    <div>
                        <h3 style={{ color: '#023047', borderBottom: '1px solid #FFB703', paddingBottom: '5px' }}>Endereço Completo</h3>
                        <div style={baseStyle}><span style={labelStyle}>CEP:</span> {profileData.cep}</div>
                        <div style={baseStyle}><span style={labelStyle}>Rua e Número:</span> {profileData.rua}, {profileData.numero}</div>
                        <div style={baseStyle}><span style={labelStyle}>Bairro:</span> {profileData.bairro}</div>
                        <div style={baseStyle}><span style={labelStyle}>Cidade/UF:</span> {profileData.localidade} / {profileData.uf}</div>
                        <div style={baseStyle}><span style={labelStyle}>Complemento:</span> {profileData.complemento || 'N/A'}</div>
                    </div>

                    <div style={{ gridColumn: '1 / span 2', marginTop: '30px', textAlign: 'center' }}>
                        <button 
                            onClick={() => setIsEditing(true)} 
                            style={{ padding: '12px 30px', backgroundColor: '#FFB703', color: '#023047', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            <FaEdit style={{ marginRight: '10px' }} />
                            Editar Meus Dados
                        </button>
                    </div>
                </div>
            )}
            
            {/* 2. MODO EDIÇÃO/CADASTRO: RENDERIZA SE shouldRenderForm FOR TRUE */}
            {shouldRenderForm && (
                // ------------------ MODO DE EDIÇÃO ------------------
                <form onSubmit={handleUpdate} style={{ padding: '0 30px' }}>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">
                        {profileData ? 'Edição de Dados' : 'Cadastro Inicial de Perfil Profissional *'}
                    </h3>
                    <div style={columnLayout}>
                        
                        {/* COLUNA ESQUERDA */}
                        <div>
                            <label>Nome do Barbeiro</label>
                            {/* Nome do barbeiro (do Token JWT) sempre deve ser apenas visualizado */}
                            <input type="text" name="nome_barbeiro" value={formData.nome_barbeiro || ''} onChange={handleChange} style={inputStyle} />
                            
                            <label>CPF/CNPJ *</label>
                            {/* CPF/CNPJ (deve ser preenchido, mas não editável após o cadastro) */}
                            <input 
                                type="text" 
                                name="documento" 
                                value={formData.documento || ''} 
                                onChange={handleChange} 
                                style={profileData ? disabledInputStyle : inputStyle} // Desabilita se o perfil já existir
                                disabled={!!profileData && !isEditing}
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

                        {/* COLUNA DIREITA */}
                        <div>
                            <label>Endereço*</label>
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
                        
                        {/* Botão de Cancelar só aparece se não for cadastro inicial */}
                        {profileData && (
                            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px 30px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                <FaTimesCircle style={{ marginRight: '10px' }} />
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

export default MeuPerfil;