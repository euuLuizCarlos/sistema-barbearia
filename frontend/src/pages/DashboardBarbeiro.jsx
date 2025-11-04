// src/pages/DashboardBarbeiro.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaDollarSign, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

const DashboardBarbeiro = () => {
    // Aqui você pode buscar dados resumidos do dia
    
    const cardStyle = {
        padding: '30px', 
        borderLeft: '5px solid #FFB703', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', 
        borderRadius: '8px',
        width: '300px', 
        textAlign: 'center',
        textDecoration: 'none',
        color: '#333',
        backgroundColor: '#fff'
    };

    return (
        <div style={{ padding: '30px' }}>
            <h1>Bem-vindo, Barbeiro!</h1>
            <p style={{ marginBottom: '40px', fontSize: '1.1em' }}>Selecione o painel de gestão para começar.</p>

            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                
                {/* Link para Transações/Caixa */}
                <Link to="/transacoes" style={cardStyle}>
                    <FaDollarSign size={40} color="#023047" />
                    <h3 style={{ marginTop: '10px' }}>Controle de Caixa</h3>
                    <p>Receitas, Despesas e Saldo do Dia.</p>
                </Link>

                {/* Link para Agenda */}
                <Link to="/agenda" style={cardStyle}>
                    <FaCalendarAlt size={40} color="#023047" />
                    <h3 style={{ marginTop: '10px' }}>Agenda de Clientes</h3>
                    <p>Visualize e crie novos agendamentos.</p>
                </Link>

                {/* Link para Relatórios */}
                <Link to="/relatorio" style={cardStyle}>
                    <FaChartLine size={40} color="#023047" />
                    <h3 style={{ marginTop: '10px' }}>Relatórios MoM/YoY</h3>
                    <p>Análise de lucro e performance.</p>
                </Link>
            </div>
        </div>
    );
};

export default DashboardBarbeiro;