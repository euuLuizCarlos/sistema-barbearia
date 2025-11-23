// src/pages/Configuracoes.jsx (CORREÇÃO FINAL)

import React from 'react';
import ConfiguracaoTaxaMaquininha from "../components/ControleCaixa/ConfiguracaoTaxaMaquininha";
import ExclusaoConta from "../components/Configuracoes/ExclusaoConta";
// 🚨 MUDANÇA: Buscando da pasta /components/Configuracoes ou /pages (Se estava falhando, vamos para /components)
import GerenciarDiasBloqueados from "../components/Configuracoes/GerenciarDiasBloqueados.jsx"; 


const Configuracoes = () => {
// ...
    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Configurações do Sistema</h1>
            
            {/* 1. Gestão de Agenda (NOVA OPÇÃO) */}
            <GerenciarDiasBloqueados />
            
            <hr style={{ margin: '30px 0' }}/> 
            
            {/* 2. Gestão Financeira */}
            <ConfiguracaoTaxaMaquininha />
            
            <hr style={{ margin: '30px 0' }}/>
            
            {/* 3. Gestão de Conta */}
            <ExclusaoConta />
            
            <p style={{ marginTop: '30px', color: '#888' }}>*As configurações de horário semanal estão em um painel separado.</p>
        </div>
    );
};

export default Configuracoes;