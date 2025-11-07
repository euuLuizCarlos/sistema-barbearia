// src/pages/DetalhesPerfil.jsx (CÓDIGO COMPLETO ATUALIZADO)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
// Importação dos ícones FaEdit, FaUserCircle e FaHome
import { FaEdit, FaUserCircle, FaHome } from 'react-icons/fa'; 

const DetalhesPerfil = () => {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await api.get('/perfil/barbeiro');
                const { profileExists, data } = response.data;

                if (profileExists) {
                    setProfileData(data);
                } else {
                    // Se, por algum motivo, o perfil sumiu, redireciona para cadastrar
                    navigate('/perfil/cadastro', { replace: true });
                }
            } catch (err) {
                setError('Erro ao carregar os detalhes do perfil.');
                console.error("Erro ao buscar perfil:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return <h2 style={{ padding: '50px', textAlign: 'center' }}>Carregando detalhes do perfil...</h2>;
    }
    
    if (error) {
        return <div style={{ color: 'red', padding: '50px', textAlign: 'center' }}>{error}</div>;
    }

    if (!profileData) {
        return <h2 style={{ padding: '50px', textAlign: 'center' }}>Nenhum dado para mostrar.</h2>;
    }
    
    // Estilos para visualização
    const containerStyle = { maxWidth: '800px', margin: '30px auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' };
    const sectionStyle = { borderBottom: '1px dashed #ccc', paddingBottom: '15px', marginBottom: '15px' };
    const dataItemStyle = { marginBottom: '10px' };
    const labelStyle = { fontWeight: 'bold', display: 'inline-block', width: '150px' };
    // Estilo para posicionar os botões
    const buttonContainerStyle = { float: 'right', marginTop: '5px' };
    const dashboardButtonStyle = { padding: '10px 20px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' };
    const editButtonStyle = { padding: '10px 20px', backgroundColor: '#023047', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };


    return (
        <div style={containerStyle}>
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047', position: 'relative' }}>
                <FaUserCircle style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                Detalhes do Perfil Profissional
                
                <div style={buttonContainerStyle}>
                    {/* BOTÃO VOLTAR AO DASHBOARD (NOVO) */}
                    <button 
                        onClick={() => navigate('/', { replace: true })} 
                        style={dashboardButtonStyle}
                    >
                        <FaHome style={{ marginRight: '5px' }} /> Dashboard
                    </button>

                    {/* Botão de Edição */}
                    <button 
                        style={editButtonStyle} 
                        onClick={() => navigate('/perfil/editar')}
                    >
                        <FaEdit style={{ marginRight: '5px' }} /> Editar
                    </button>
                </div>
            </h1>

            <div style={sectionStyle}>
                <h2>Informações da Barbearia</h2>
                <div style={dataItemStyle}><span style={labelStyle}>Nome Fantasia:</span> {profileData.nome_barbearia}</div>
                <div style={dataItemStyle}><span style={labelStyle}>CNPJ/CPF:</span> {profileData.documento}</div>
                <div style={dataItemStyle}><span style={labelStyle}>Telefone:</span> {profileData.telefone}</div>
            </div>

            <div style={sectionStyle}>
                <h2>Endereço</h2>
                <div style={dataItemStyle}><span style={labelStyle}>CEP:</span> {profileData.cep}</div>
                <div style={dataItemStyle}><span style={labelStyle}>Rua:</span> {profileData.rua}, {profileData.numero}</div>
                <div style={dataItemStyle}><span style={labelStyle}>Bairro:</span> {profileData.bairro}</div>
                <div style={dataItemStyle}><span style={labelStyle}>Cidade/UF:</span> {profileData.localidade} - {profileData.uf}</div>
                {profileData.complemento && <div style={dataItemStyle}><span style={labelStyle}>Complemento:</span> {profileData.complemento}</div>}
            </div>

        </div>
    );
};

export default DetalhesPerfil;