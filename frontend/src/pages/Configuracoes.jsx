// src/pages/Configuracoes.jsx
import React from 'react';
import ConfiguracaoTaxaMaquininha from '../components/ControleCaixa/ConfiguracaoTaxaMaquininha'; 
// Importe o novo componente
import ExclusaoConta from '../components/Configuracoes/ExclusaoConta'; 

const Configuracoes = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Configurações do Sistema</h1>
            
            <ConfiguracaoTaxaMaquininha />
            
            {/* NOVO: Componente de Exclusão de Conta */}
            <ExclusaoConta />
            
            <p style={{ marginTop: '30px', color: '#888' }}>*Aqui poderiam ser adicionadas outras configurações futuras, como horários de funcionamento, etc.</p>
        </div>
    );
};

export default Configuracoes;