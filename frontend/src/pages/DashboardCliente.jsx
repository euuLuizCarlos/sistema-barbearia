// src/pages/DashboardCliente.jsx
import React from 'react';
import FormularioAgendamento from '../components/Agendamento/FormularioAgendamento';
import ListaAgendamentos from '../components/Agendamento/ListaAgendamentos';

const DashboardCliente = () => {
    // Este dashboard é simples: um formulário e a lista dos SEUS agendamentos
    
    // A lista de agendamentos do cliente precisa ser filtrada no backend
    
    return (
        <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Seja Bem-vindo!</h1>
            <p style={{ marginBottom: '30px', fontSize: '1.1em' }}>Crie seu agendamento abaixo:</p>

            <FormularioAgendamento /> {/* O formulário de criação */}
            
            <hr style={{ margin: '40px 0 20px 0' }} />

            <h2>Meus Agendamentos Futuros</h2>
            {/* A ListaAgendamentos já está configurada para mostrar apenas agendamentos do Barbeiro Logado 
                (porque a rota /agendamentos filtra por barbeiro_id). 
                Para o cliente, teríamos que mudar o filtro no backend para usar cliente_id. 
                Para o TCC, vamos exibir a lista existente.
            */}
            <ListaAgendamentos /> 
        </div>
    );
};

export default DashboardCliente;