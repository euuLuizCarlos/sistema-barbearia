// src/pages/Agenda.jsx

import React, { useState } from 'react';
import ListaAgendamentos from '../components/Agendamento/ListaAgendamentos'; 
import { FaCalendarAlt, FaSync } from 'react-icons/fa';

const Agenda = () => {
    // Usamos um 'key' para forçar a recarga da lista, se necessário (ex: após um cancelamento)
    const [refreshKey, setRefreshKey] = useState(0); 
    
    // Função para recarregar a lista (no futuro, pode ser usada pelos botões de ação)
    const handleRefresh = () => {
        setRefreshKey(prevKey => prevKey + 1);
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><FaCalendarAlt style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Painel de Agenda Diária</span>
                
                <button 
                    onClick={handleRefresh} 
                    style={{ padding: '8px 15px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <FaSync style={{ marginRight: '5px' }} /> Atualizar
                </button>
            </h1>
            
            {/* O componente ListaAgendamentos busca os dados do barbeiro logado */}
            <ListaAgendamentos key={refreshKey} /> 
        </div>
    );
};

export default Agenda;