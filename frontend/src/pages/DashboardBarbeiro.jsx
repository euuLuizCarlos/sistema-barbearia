// src/pages/DashboardBarbeiro.jsx (CÓDIGO ATUALIZADO COM CENTRALIZAÇÃO)

import React from 'react';
import { Link } from 'react-router-dom';
import { FaDollarSign, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

// Definindo as cores base para evitar dependências e garantir o padrão
const PRIMARY_COLOR = '#023047';
const ACCENT_COLOR = '#FFB703';

const DashboardBarbeiro = () => {
    
    // Estilos do Card
    const cardStyle = {
        padding: '30px', 
        borderLeft: `5px solid ${ACCENT_COLOR}`, 
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', 
        borderRadius: '8px',
        width: '300px', 
        textAlign: 'center',
        textDecoration: 'none',
        color: '#333',
        backgroundColor: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
    };
    
    // Estilo para o hover (melhora a UX)
    const hoverStyle = { transform: 'translateY(-4px)', boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)' };


    return (
        // 💡 CONTÊINER PRINCIPAL: Centraliza o bloco inteiro
        <div style={{ 
            padding: '30px 20px', 
            textAlign: 'center',
            minHeight: '80vh', // Garante que a centralização vertical seja percebida
        }}>
            
            <h1 style={{ color: PRIMARY_COLOR }}>Bem-vindo, Barbeiro!</h1>
            <p style={{ marginBottom: '40px', fontSize: '1.1em', color: '#555' }}>
                Selecione o painel de gestão para começar.
            </p>

            {/* 💡 CONTÊINER DOS CARDS: Centralizado horizontalmente */}
            <div style={{ 
                display: 'flex', 
                gap: '40px', 
                flexWrap: 'wrap',
                justifyContent: 'center', // Centralização horizontal dos cards
                marginTop: '50px',
            }}>
                
                {/* Link para Transações/Caixa */}
                <Link 
                    to="/transacoes" 
                    style={cardStyle}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, cardStyle)}
                >
                    <FaDollarSign size={40} color={PRIMARY_COLOR} />
                    <h3 style={{ marginTop: '10px' }}>Controle de Caixa</h3>
                    <p>Receitas e Despesas.</p>
                </Link>

                {/* Link para Agenda */}
                <Link 
                    to="/agenda" 
                    style={cardStyle}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, cardStyle)}
                >
                    <FaCalendarAlt size={40} color={PRIMARY_COLOR} />
                    <h3 style={{ marginTop: '10px' }}>Agenda de Clientes</h3>
                    <p>Visualize novos agendamentos.</p>
                </Link>

                {/* Link para Relatórios */}
                <Link 
                    to="/relatorio" 
                    style={cardStyle}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, cardStyle)}
                >
                    <FaChartLine size={40} color={PRIMARY_COLOR} />
                    <h3 style={{ marginTop: '10px' }}>Relatórios</h3>
                    <p>Análise de lucro e performance.</p>
                </Link>
            </div>
        </div>
    );
};

export default DashboardBarbeiro;