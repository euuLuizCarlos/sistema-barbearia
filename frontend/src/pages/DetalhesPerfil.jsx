import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaEdit, FaUserCircle, FaHome } from 'react-icons/fa'; // Importado FaHome para o botão

// --- FUNÇÕES DE MÁSCARA PARA EXIBIÇÃO (Mantidas) ---
const formatCpfCnpj = (value) => {
    if (!value) return '';
    value = String(value).replace(/\D/g, ''); 
    if (value.length === 11) { // CPF
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length === 14) { // CNPJ
        return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return value;
};

const formatCep = (value) => {
    if (!value) return '';
    value = String(value).replace(/\D/g, '');
    if (value.length === 8) {
        return value.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
};

const formatAddress = (data) => {
    if (!data.rua) return 'Endereço não cadastrado.';
    const cepFormatado = formatCep(data.cep);
    return `${data.rua}, N° ${data.numero}, ${data.bairro}, ${data.localidade} - ${data.uf} (CEP: ${cepFormatado})`;
};


const DetalhesPerfil = () => {
    const navigate = useNavigate();
    const [perfilData, setPerfilData] = useState({});
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [fotoUrl, setFotoUrl] = useState(null); 

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const response = await api.get('/perfil/barbeiro');
            
            if (response.data.profileExists) {
                const data = response.data.data;
                setPerfilData(data);
                
                if (data.foto_perfil) {
                    setFotoUrl(data.foto_perfil);
                }
            } else {
                setApiError("Perfil não encontrado. Redirecionando para o cadastro.");
                setTimeout(() => navigate('/cadastro-perfil'), 1000);
                return;
            }
        } catch (err) {
            setApiError("Erro ao carregar os dados do perfil.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    // --- RENDERIZAÇÃO ---
    if (loading) { return <h2 style={{ padding: '50px', textAlign: 'center' }}>Carregando Perfil...</h2>; }
    if (apiError && !perfilData.nome_barbeiro) { 
        return <h2 style={{ padding: '50px', textAlign: 'center', color: 'red' }}>{apiError}</h2>; 
    }

    const fotoSource = fotoUrl ? `http://localhost:3000${fotoUrl}` : null;
    
    // 🚨 Estilos para os botões 🚨
    const buttonStyle = { 
        padding: '8px 15px', 
        borderRadius: '5px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        marginLeft: '10px',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    };

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047', position: 'relative' }}>
                Detalhes do Meu Perfil Profissional
                
                {/* 🚨 Contêiner dos Botões 🚨 */}
                <div style={{ position: 'absolute', right: '0', top: '0', display: 'flex' }}>
                    
                    {/* NOVO: Botão Voltar para o Dashboard */}
                    <button 
                        onClick={() => navigate('/', { replace: true })} 
                        style={{ 
                            ...buttonStyle,
                            backgroundColor: '#555', 
                            color: '#fff',
                        }}
                    >
                        <FaHome /> Início
                    </button>
                    
                    {/* Botão Editar Perfil */}
                    <button 
                        onClick={() => navigate('/perfil/editar', { state: { isEditing: true } })} // Passa estado para tela de edição
                        style={{ 
                            ...buttonStyle,
                            backgroundColor: '#FFB703', 
                            color: '#023047',
                        }}
                    >
                        <FaEdit /> Editar Perfil
                    </button>
                </div>
            </h1>

            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                
                {/* BLOCO DE EXIBIÇÃO DA FOTO SALVA */}
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ 
                        width: '150px', 
                        height: '150px', 
                        borderRadius: '50%', 
                        border: '5px solid #023047', 
                        overflow: 'hidden', 
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5'
                    }}>
                        {fotoSource ? (
                            <img 
                                src={fotoSource} 
                                alt="Foto de Perfil"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <FaUserCircle size={100} color="#ccc" /> 
                        )}
                    </div>
                    <h2 style={{ margin: '0', color: '#333' }}>{perfilData.nome_barbeiro}</h2> 
                </div>
                
                {/* SEÇÃO DE DETALHES DE TEXTO */}
                <div style={{ flexGrow: 1, borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
                    <p><strong>Nome da Barbearia:</strong> {perfilData.nome_barbearia}</p>
                    
                    {/* 🚨 Formatação de CPF/CNPJ Corrigida */}
                    <p>
                        <strong>Documento (CPF/CNPJ):</strong> 
                        {formatCpfCnpj(perfilData.documento)}
                    </p>
                    
                    <p><strong>Telefone:</strong> {perfilData.telefone}</p>
                    <hr style={{ margin: '15px 0', borderColor: '#eee' }}/>
                    
                    {/* 🚨 Formatação de Endereço e CEP Corrigida */}
                    <p><strong>Endereço:</strong> {formatAddress(perfilData)}</p>
                    
                    {perfilData.complemento && <p><strong>Complemento:</strong> {perfilData.complemento}</p>}
                </div>
            </div>
        </div>
    );
};

export default DetalhesPerfil;