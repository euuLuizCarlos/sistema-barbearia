// src/pages/Relatorios.jsx (CÓDIGO ATUALIZADO)

import React, { useState } from 'react';
import RelatorioUnificado from '../components/ControleCaixa/RelatorioUnificado';
import ModalRelatorioDetalhe from '../components/ControleCaixa/ModalRelatorioDetalhe'; 

const Relatorios = () => {
    // Estado para controlar a visualização: 'daily', 'monthly', 'annual'
    const [reportType, setReportType] = useState('monthly'); 

    // Estado para controlar as datas
    const hoje = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    
    // YYYY-MM-DD
    const dataAtualDefault = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
    
    const [dataDiaria, setDataDiaria] = useState(dataAtualDefault);
    const [mesAno, setMesAno] = useState(`${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`);
    const [ano, setAno] = useState(hoje.getFullYear());


    // --- LÓGICA DO MODAL ---
    const [relatorioDetalhe, setRelatorioDetalhe] = useState(null); 
    
    const handleOpenDetalhe = (data) => {
        setRelatorioDetalhe(data);
    };

    const handleCloseDetalhe = () => {
        setRelatorioDetalhe(null);
    };
    // ----------------------------


    // Extrai o mês e ano do estado mesAno
    const anoMensal = mesAno.substring(0, 4);
    const mesMensal = mesAno.substring(5, 7);
    
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* RENDERIZAÇÃO DO MODAL DE DETALHES */}
            {relatorioDetalhe && (
                <ModalRelatorioDetalhe 
                    dados={relatorioDetalhe} 
                    onClose={handleCloseDetalhe} 
                />
            )}
            
            <h1 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Relatórios Financeiros</h1>
            
            {/* 1. SELEÇÃO DO TIPO DE RELATÓRIO (ABA ÚNICA) */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #ccc', paddingBottom: '15px', alignItems: 'center' }}>
                
                <select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    style={{ padding: '10px', fontSize: '1.1em', fontWeight: 'bold' }}
                >
                    {/* 🚨 RÓTULOS SIMPLIFICADOS AQUI 🚨 */}
                    <option value="monthly">Relatório Mensal</option>
                    <option value="daily">Relatório Diário</option>
                    <option value="annual">Relatório Anual</option>
                    {/* Opção 'all' (Visão Geral) Removida */}
                </select>

                {/* SELETORES DE DATA CONDICIONAIS (Mantidos) */}
                {reportType === 'daily' && (
                    <input type="date" value={dataDiaria} onChange={(e) => setDataDiaria(e.target.value)} style={{ padding: '10px' }} />
                )}
                {reportType === 'monthly' && (
                    <input type="month" value={mesAno} onChange={(e) => setMesAno(e.target.value)} style={{ padding: '10px' }} />
                )}
                {reportType === 'annual' && (
                    <input type="number" value={ano} onChange={(e) => setAno(e.target.value)} style={{ padding: '10px', width: '100px' }} placeholder="Ano" />
                )}
            </div>

            {/* 2. COMPONENTE DE RELATÓRIO UNIFICADO (CHAMADA PRINCIPAL) */}
            <RelatorioUnificado 
                reportType={reportType}
                dataDiaria={dataDiaria}
                mes={mesMensal}
                ano={anoMensal}
                anoAnual={ano}
                onOpenDetalhe={handleOpenDetalhe}
            />
        </div>
    );
};

export default Relatorios;