import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaSave, FaTimes, FaSpinner, FaUserEdit, FaBuilding } from 'react-icons/fa';

// Definindo cores localmente
const PRIMARY_COLOR = '#023047';
const ACCENT_COLOR = '#FFB703';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#cc0000';
const MAX_WIDTH = '700px';

const PerfilEditar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const isBarbeiro = user?.userType === 'barbeiro' || user?.userType === 'admin';
    const endpoint = isBarbeiro ? '/perfil/barbeiro' : '/perfil/cliente'; 

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // --- FUNÇÕES DE MÁSCARA E VIACEP ---
    
    const maskCep = (value) => {
        if (!value) return '';
        const v = String(value).replace(/\D/g, '').substring(0, 8);
        return v.replace(/^(\d{5})(.*)$/, (m, p1, p2) => p1 + (p2 ? '-' + p2 : ''));
    };

    const maskTelefone = (value) => {
        if (!value) return '';
        const v = String(value).replace(/\D/g, '').substring(0, 11);
        if (v.length <= 10) {
            return v.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (m, g1, g2, g3) => {
                let out = '';
                if (g1) out = `(${g1})`;
                if (g2) out += ` ${g2}`;
                if (g3) out += `-${g3}`;
                return out.replace(/-$/, '');
            });
        }
        return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    };

    const maskDocumento = (value) => {
        if (!value) return '';
        const v = String(value).replace(/\D/g, '').substring(0, 14);
        if (v.length <= 11) {
            return v.replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return v.replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    const handleCepBlur = async (e) => {
        const raw = (e.target.value || '').replace(/\D/g, '');
        if (raw.length !== 8) return; 

        try {
            const resp = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
            const data = await resp.json();
            
            if (!data || data.erro) return;
            
            setFormData(f => ({
                ...f,
                rua: data.logradouro || f.rua,
                bairro: data.bairro || f.bairro,
                localidade: data.localidade || f.localidade,
                uf: data.uf || f.uf,
            }));
            
        } catch (err) {
            console.warn('Falha ao consultar CEP:', err);
        }
    };
    
    // --- 1. BUSCA DE DADOS INICIAIS ---
   const fetchProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.get(endpoint);
            const data = response.data.data || response.data;
            
            setFormData({
                nome: data.nome || data.nome_barbeiro_auth || '',
                email: data.email || '',
                telefone: data.telefone || '',
                documento: data.documento || '',
                
                // Campos específicos do Barbeiro
                nome_barbearia: data.nome_barbearia || '',
                rua: data.rua || '',
                numero: data.numero || '',
                cep: data.cep || '',
                bairro: data.bairro || '',
                localidade: data.localidade || '',
                uf: data.uf || '',
                complemento: data.complemento || '', // Este é o campo opcional
            });
        } catch (err) {
            console.error("Erro ao carregar perfil para edição:", err);
            setError("Não foi possível carregar os dados para edição.");
        } finally {
            setLoading(false);
        }
    }, [user, endpoint, isBarbeiro]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);


    // --- 2. HANDLERS GERAIS E SUBMISSÃO ---
   const handleChange = (e) => {
        const { name, value } = e.target;
        // Aplicação de máscaras
        setFormData(prev => ({ ...prev, [name]: value }));
        setSuccessMessage('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            // SANEAMENTO DE DADOS ANTES DE ENVIAR (Limpeza de máscaras e nulls)
            const cleanedTelefone = (formData.telefone || '').replace(/\D/g, '');
            const cleanedDocumento = (formData.documento || '').replace(/\D/g, '');
            const cleanedCep = (formData.cep || '').replace(/\D/g, '');
            const finalComplemento = (formData.complemento === '') ? null : formData.complemento;

            // PAYLOAD BASE (Cliente e Barbeiro)
            const payload = {
                nome: formData.nome, // NOME É NECESSÁRIO PARA O BACKEND
                telefone: cleanedTelefone,
                documento: cleanedDocumento,
            };

            if (isBarbeiro) {
                // ADICIONA TODOS OS CAMPOS DE PERFIL DA BARBEARIA (OBRIGATÓRIO PELO BACKEND)
                Object.assign(payload, {
                    nome_barbearia: formData.nome_barbearia,
                    rua: formData.rua,
                    numero: formData.numero,
                    cep: cleanedCep,
                    bairro: formData.bairro,
                    localidade: formData.localidade,
                    uf: formData.uf,
                    complemento: finalComplemento, // Correção: Campo opcional enviado como null
                    
                    // ESSENCIAIS para a lógica do backend (se o backend precisar)
                    nome_barbeiro: formData.nome, 
                });
            }

            await api.post(endpoint, payload);
            
            setSuccessMessage('Perfil atualizado com sucesso!');
            
            // Navegação segura após o sucesso
            navigate('/meu-perfil', { replace: true }); 

        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
            const serverErrorMsg = err.response?.data?.error || 'Falha ao salvar. Verifique se o backend está rodando e se a query aceita todos os campos.';
            setError(serverErrorMsg);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- ESTILOS E FUNÇÕES AUXILIARES ---
    const inputStyle = {
        width: '100%', padding: '10px', marginBottom: '15px', 
        border: '1px solid #ccc', borderRadius: '4px',
        boxSizing: 'border-box', 
    };
    const inputDisabledStyle = { ...inputStyle, backgroundColor: '#f9f9f9', color: '#666' };
    const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: PRIMARY_COLOR };
    const buttonSaveStyle = { backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR, padding: '10px 20px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };
    const buttonCancelStyle = { backgroundColor: '#ccc', color: '#333', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' };

    const formatDocumentLabel = (doc) => {
        if (!doc) return "Documento:";
        const cleaned = String(doc).replace(/\D/g, '');
        if (cleaned.length <= 11) return "CPF:";
        return "CNPJ:";
    };


    // --- RENDERIZAÇÃO ---
    if (loading) {
        return <h1 style={{ padding: '50px', textAlign: 'center' }}><FaSpinner className="spinner" /> Carregando Formulário...</h1>;
    }
    
    const pageTitle = isBarbeiro ? "Editar Perfil Profissional" : "Editar Meu Perfil";

    return (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', minHeight: '80vh' }}>
            
            <div style={{ maxWidth: MAX_WIDTH, width: '100%', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
                
                <h1 style={{ borderBottom: '2px solid #FFB703', paddingBottom: '10px', color: PRIMARY_COLOR, marginBottom: '30px' }}>
                    <FaUserEdit style={{ marginRight: '10px'}}/> {pageTitle}
                </h1>

                {successMessage && <p style={{ color: SUCCESS_COLOR, fontWeight: 'bold', marginBottom: '15px' }}>{successMessage}</p>}
                {error && <p style={{ color: ERROR_COLOR, fontWeight: 'bold', marginBottom: '15px' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    
                    {/* DADOS GERAIS */}
                    
                    <label style={labelStyle}>Nome (Não editável):</label>
                    <input type="text" name="nome" value={formData.nome} style={inputDisabledStyle} disabled />

                    <label style={labelStyle}>Email (Não editável):</label>
                    <input type="email" value={formData.email} disabled style={inputDisabledStyle} />

                    <label style={labelStyle}>{formatDocumentLabel(formData.documento)} (Não editável):</label>
                    <input type="text" name="documento" value={maskDocumento(formData.documento)} disabled style={inputDisabledStyle} />

                    <label style={labelStyle}>Telefone:</label>
                    <input type="tel" name="telefone" value={maskTelefone(formData.telefone)} onChange={handleChange} required style={inputStyle} disabled={isSaving} />

                    {/* DADOS ESPECÍFICOS DO BARBEIRO */}
                    {isBarbeiro && (
                        <div style={{ marginTop: '25px', borderTop: '1px dashed #ddd', paddingTop: '20px' }}>
                            <h3 style={{ color: PRIMARY_COLOR, marginBottom: '15px' }}><FaBuilding /> Detalhes da Barbearia</h3>
                            
                            <label style={labelStyle}>Nome da Barbearia:</label>
                            <input type="text" name="nome_barbearia" value={formData.nome_barbearia} onChange={handleChange} required style={inputStyle} disabled={isSaving} />
                            
                            {/* ENDEREÇO EM LINHA: CEP e Número */}
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>CEP:</label>
                                    <input type="text" name="cep" value={maskCep(formData.cep)} onChange={handleChange} onBlur={handleCepBlur} style={inputStyle} disabled={isSaving} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Número:</label>
                                    <input type="text" name="numero" value={formData.numero} onChange={handleChange} style={inputStyle} disabled={isSaving} required />
                                </div>
                            </div>
                            
                            {/* Outros campos de endereço (Rua, etc.) */}
                            <label style={labelStyle}>Rua:</label>
                            <input type="text" name="rua" value={formData.rua} onChange={handleChange} required style={inputStyle} disabled={isSaving} />
                            
                            <label style={labelStyle}>Bairro:</label>
                            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} required style={inputStyle} disabled={isSaving} />
                            
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={labelStyle}>Cidade:</label>
                                    <input type="text" name="localidade" value={formData.localidade} onChange={handleChange} required style={inputStyle} disabled={isSaving} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>UF:</label>
                                    <input type="text" name="uf" value={formData.uf} onChange={handleChange} required style={inputStyle} disabled={isSaving} />
                                </div>
                            </div>
                            
                            <label style={labelStyle}>Complemento (Opcional):</label>
                            <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} style={inputStyle} disabled={isSaving} />

                        </div>
                    )}

                    {/* BOTÕES DE AÇÃO */}
                    <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-start' }}>
                        <button type="submit" disabled={isSaving} style={buttonSaveStyle}>
                            {isSaving ? <FaSpinner className="spinner" /> : <FaSave />} Salvar
                        </button>
                        <button type="button" onClick={() => navigate('/meu-perfil')} disabled={isSaving} style={buttonCancelStyle}>
                            <FaTimes /> Cancelar
                        </button>
                    </div>
                </form>
            </div>
            
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default PerfilEditar;