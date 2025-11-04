// src/pages/Relatorios.jsx (CÓDIGO CORRIGIDO PARA O MODAL)
import React, { useState } from 'react';
import RelatorioUnificado from '../components/ControleCaixa/RelatorioUnificado';
import ModalRelatorioDetalhe from '../components/ControleCaixa/ModalRelatorioDetalhe'; // 1. IMPORTANDO O MODAL

const Relatorios = () => {
    // Estado para controlar a visualização: 'daily', 'monthly', 'annual', 'all'
    const [reportType, setReportType] = useState('monthly'); 

    // Estado para controlar as datas
    const hoje = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    
    // YYYY-MM-DD
    const dataAtualDefault = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
    
    const [dataDiaria, setDataDiaria] = useState(dataAtualDefault);
    const [mesAno, setMesAno] = useState(`${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`);
    const [ano, setAno] = useState(hoje.getFullYear());


    // --- 2. LÓGICA DO MODAL ---
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
            
            {/* 3. RENDERIZAÇÃO DO MODAL DE DETALHES */}
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
                    <option value="monthly">Relatório Mensal (MoM)</option>
                    <option value="daily">Relatório Diário (DoD)</option>
                    <option value="annual">Relatório Anual (YoY)</option>
                    <option value="all">Visão Geral Completa</option>
                </select>

                {/* SELETORES DE DATA CONDICIONAIS */}
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
                onOpenDetalhe={handleOpenDetalhe} // <--- CORREÇÃO: PASSANDO O HANDLER AQUI
            />
        </div>
    );
};

export default Relatorios;