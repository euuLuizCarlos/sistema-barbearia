// src/pages/DetalhesPerfil.jsx (CÓDIGO FINAL E CORRIGIDO PARA PERSISTÊNCIA DA FOTO)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext'; 
import { FaUserCircle, FaEnvelope, FaPhone, FaIdCard, FaSpinner, FaTools, FaBuilding, FaCamera } from 'react-icons/fa';
import ExclusaoConta from '../components/Configuracoes/ExclusaoConta'; 

// Definindo cores localmente
const PRIMARY_COLOR = '#023047';
const ACCENT_COLOR = '#FFB703';
const MAX_WIDTH = '800px';

const DetalhesPerfil = () => {
    const { user } = useAuth();
    const ui = useUi(); 
    const navigate = useNavigate();
    
    // Lógica para Barbeiro/Cliente
    const isBarbeiro = user?.userType === 'barbeiro' || user?.userType === 'admin';
    const endpoint = isBarbeiro ? '/perfil/barbeiro' : '/perfil/cliente'; 

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false); 
    const [fotoUrl, setFotoUrl] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(null);

    // --- FUNÇÕES DE MÁSCARA E FORMATAÇÃO (Implemente suas máscaras aqui) ---
    const maskDocumento = (value) => { 

        if (!value) return '';

        const v = String(value).replace(/\D/g, '').substring(0, 14);

        if (v.length <= 11) return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        return v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');

    };

    const maskTelefone = (value) => { 

        if (!value) return '';

        const v = String(value).replace(/\D/g, '').substring(0, 11);

        if (v.length <= 10) return v.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, '($1) $2-$3').replace(') -', ') '); // Remove traço se incompleto

        return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

    };
    
   const getPageTitle = () => {
        return isBarbeiro ? "Detalhes do Meu Perfil Profissional" : "Detalhes do Meu Perfil"; 
    };

    // --- FUNÇÃO DE BUSCA DE PERFIL (Principal) ---
    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.get(endpoint);
            const data = response.data.data || response.data;
            
            // CONSTRUÇÃO DA FOTO URL: Assume que foto_perfil está agora no objeto 'data'
            const fotoPath = data.foto_perfil ? `http://localhost:3000${data.foto_perfil}` : null;
            
            setFotoUrl(fotoPath);
            setProfileData(data);

        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
            setError("Não foi possível carregar os dados do perfil.");
        } finally {
            setLoading(false);
        }
    }, [user, endpoint]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    // --- LÓGICA DE UPLOAD DE FOTO ---
    
    const handlePhotoSelect = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file)); 
        
        handlePhotoUpload(file);
    };

    const handlePhotoUpload = async (file) => {
        setUploading(true);
        const uploadEndpoint = isBarbeiro ? '/perfil/foto' : '/perfil/cliente/foto';
        const formData = new FormData();
        formData.append('foto_perfil', file);

        try {
            await api.put(uploadEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            ui.showPostIt("Foto atualizada com sucesso! A imagem agora está salva.", 'success');
            
            // 🚨 Ação Crítica: Recarrega o perfil para pegar o novo caminho do DB
            await fetchProfile(); 
            setPreviewUrl(null); 

        } catch (error) {
            console.error("Falha no upload da foto:", error);
            const errorMessage = error.response?.data?.error || "Erro ao salvar a foto.";
            
            ui.showPostIt(errorMessage, 'error');
            
            setPreviewUrl(null);
            await fetchProfile(); // Recarrega para mostrar a foto original em caso de falha
            
        } finally {
            setUploading(false);
        }
    };
    
    // --- FUNÇÕES AUXILIARES DE LAYOUT ---
    const formatPhone = (value) => { return maskTelefone(value); };
    const formatDocumentLabel = (doc) => {
        if (!doc) return "Documento:";
        const cleaned = String(doc).replace(/\D/g, '');
        if (cleaned.length <= 11) return "CPF:";
        return "CNPJ:";
    };


    // --- RENDERIZAÇÃO ---
    if (loading) {
        return <h1 style={{ padding: '50px', textAlign: 'center' }}><FaSpinner className="spinner" /> Carregando Perfil...</h1>;
    }
    if (error || !profileData) {
        return <h1 style={{ padding: '50px', color: 'red' }}>{error || "Dados não encontrados."}</h1>;
    }
    
    const dadosExibicao = profileData; 

    const buttonStyle = { padding: '10px 15px', background: ACCENT_COLOR, color: PRIMARY_COLOR, border: 'none', fontWeight: 'bold' };

    return (
        <div style={{ padding: '20px', maxWidth: MAX_WIDTH, margin: 'auto' }}>
            
            {/* TÍTULO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid #ddd`, paddingBottom: '10px' }}>
                <h1 style={{ margin: 0 }}>
                    {getPageTitle()}
                </h1>
                
                {/* BOTÕES DE AÇÃO */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '10px 15px', border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 'bold' }}>
                        Início
                    </button>
                    <button onClick={() => navigate('/perfil/editar')} style={buttonStyle}>
                        <FaTools style={{ marginRight: '5px' }} /> Editar Perfil
                    </button>
                </div>
            </div>


            <div style={{ padding: '30px 20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                
                {/* BLOCO DA FOTO E INFORMAÇÕES BÁSICAS */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '30px' }}>
                    
                    {/* ÁREA DA FOTO CLICÁVEL */}
                    <label htmlFor="photo-upload" style={{ position: 'relative', cursor: 'pointer', marginRight: '30px' }}>
                        
                        {/* Imagem ou Placeholder (Prioriza previewUrl > fotoUrl > Placeholder) */}
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f0f0f0', overflow: 'hidden', border: `3px solid ${ACCENT_COLOR}` }}>
                            {(previewUrl || fotoUrl) ? (
                                <img src={previewUrl || fotoUrl} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FaUserCircle size={100} color="#ccc" style={{ padding: '10px' }} />
                            )}
                        </div>

                        {/* Ícone de Câmera/Upload no canto inferior */}
                        <div style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: PRIMARY_COLOR, color: 'white', borderRadius: '50%', padding: '5px' }}>
                            {uploading ? <FaSpinner size={16} className="spinner" /> : <FaCamera size={16} />}
                        </div>
                        
                        {/* Input de arquivo escondido */}
                        <input
                            type="file"
                            id="photo-upload"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </label>

                    {/* DADOS PRINCIPAIS DO PERFIL */}
                    <div style={{ overflow: 'hidden', paddingTop: '15px' }}>
                        <h2 style={{ margin: '0 0 10px 0', color: PRIMARY_COLOR }}>{dadosExibicao.nome}</h2>
                        
                        <p><FaEnvelope style={{ marginRight: '5px' }} /> <strong>Email:</strong> {dadosExibicao.email}</p>
                        <p><FaPhone style={{ marginRight: '5px' }} /> <strong>Telefone:</strong> {maskTelefone(dadosExibicao.telefone)}</p>
                        
                        {/* Exibe CPF/CNPJ (com máscara de exibição) */}
                        {dadosExibicao.documento && <p><FaIdCard style={{ marginRight: '5px' }} /> <strong>{isBarbeiro ? 'CPF/CNPJ' : 'CPF'}:</strong> {maskDocumento(dadosExibicao.documento)}</p>}
                    </div>

                </div>
                {/* FIM BLOCO DA FOTO */}
                
                
                {isBarbeiro && (
                    <div style={{ clear: 'both', marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                        <h3 style={{ marginTop: '0', color: ACCENT_COLOR }}><FaBuilding /> Detalhes da Barbearia</h3>
                        <p><strong>Estabelecimento:</strong> {dadosExibicao.nomeBarbearia}</p>
                        <p><strong>Endereço:</strong> {dadosExibicao.rua}, N° {dadosExibicao.numero} - {dadosExibicao.localidade}/{dadosExibicao.uf}</p>
                    </div>
                )}
            </div>

            {/* OPÇÃO DE EXCLUSÃO DE CONTA */}
            <div style={{ marginTop: '30px' }}>
                <ExclusaoConta /> 
            </div>

            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default DetalhesPerfil;