// src/components/Auth/EscolhaTipoUsuario.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaCut } from 'react-icons/fa'; 

const EscolhaTipoUsuario = () => {
    const navigate = useNavigate();

    const handleSelect = (userType) => {
        // Redireciona de volta para a rota /register, mas com o tipo na URL
        navigate(`/register?type=${userType}`); 
    };

    const cardStyle = {
        padding: '30px', margin: '10px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff', width: '180px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
        textAlign: 'center', border: '2px solid #023047', color: '#023047'
    };
    const hoverStyle = { transform: 'translateY(-5px)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)' };


    return (
        <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', backgroundColor: '#FFFFFF', fontFamily: 'Arial, sans-serif', padding: '20px'
        }}>
            <h1 style={{ marginBottom: '40px', color: '#023047' }}>Qual o seu perfil?</h1>

            <div style={{ display: 'flex', gap: '40px' }}>
                {/* Opção Barbeiro */}
                <div 
                    style={cardStyle}
                    onClick={() => handleSelect('barbeiro')}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' })}
                >
                    <FaUserTie size={50} style={{ color: '#FFB703', marginBottom: '10px' }} />
                    <h3 style={{ margin: 0 }}>Barbeiro</h3>
                    <p style={{ fontSize: '0.9em', color: '#555' }}>Gestão e Agenda</p>
                </div>

                {/* Opção Cliente */}
                <div 
                    style={cardStyle}
                    onClick={() => handleSelect('cliente')}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' })}
                >
                    <FaCut size={50} style={{ color: '#FFB703', marginBottom: '10px' }} />
                    <h3 style={{ margin: 0 }}>Cliente</h3>
                    <p style={{ fontSize: '0.9em', color: '#555' }}>Fazer Agendamento</p>
                </div>
            </div>
            <p style={{ marginTop: '50px', color: '#023047' }}>Já tem conta? <a href="/login" style={{ color: '#FFB703', fontWeight: 'bold' }}>Faça Login</a></p>
        </div>
    );
};

export default EscolhaTipoUsuario;