// src/pages/Dashboard.jsx
import React from 'react';
import ListaAgendamentos from '../components/Agendamento/ListaAgendamentos';

const Dashboard = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Página Principal (Dashboard)</h1>
            <p>Seu saldo total e o resumo do dia aparecerão aqui.</p>
            
            <ListaAgendamentos /> {/* Lista de agendamentos temporária */}
        </div>
    );
};

export default Dashboard;