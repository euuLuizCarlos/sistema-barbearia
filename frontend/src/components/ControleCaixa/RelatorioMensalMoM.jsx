// src/components/ControleCaixa/RelatorioMensalMoM.jsx (AGORA SEM GRÁFICO, APENAS CARDS)
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const RelatorioMensalMoM = ({ anoSelecionado, mesSelecionado, onOpenDetalhe }) => {
    
    const getMeses = (ano, mes) => {
        const anoNum = parseInt(ano, 10);
        const mesNum = parseInt(mes, 10);
        
        let anoAnterior = anoNum;
        let mesAnteriorNum = mesNum - 1;
        
        if (mesAnteriorNum === 0) { 
            mesAnteriorNum = 12;
            anoAnterior = anoNum - 1;
        }

        return {
            mesAtual: { ano: anoNum, mes: mesNum },
            mesAnterior: { ano: anoAnterior, mes: mesAnteriorNum }
        };
    };

    const [mesAtualData, setMesAtualData] = useState(null);
    const [mesAnteriorData, setMesAnteriorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!anoSelecionado || !mesSelecionado) return; 
        
        const { mesAtual, mesAnterior } = getMeses(anoSelecionado, mesSelecionado);

        const fetchRelatorio = async () => {
            setLoading(true);
            try {
                const atualResponse = await api.get(`/relatorio/mensal/${mesAtual.ano}/${mesAtual.mes}`);
                setMesAtualData(atualResponse.data);

                const anteriorResponse = await api.get(`/relatorio/mensal/${mesAnterior.ano}/${mesAnterior.mes}`);
                setMesAnteriorData(anteriorResponse.data);

            } catch (error) {
                console.error("Erro ao buscar relatório MoM:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatorio();
    }, [anoSelecionado, mesSelecionado]);

    if (loading) {
        return <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd' }}>
            Carregando Relatório Mensal...
        </div>;
    }

    // --- LÓGICA DE CÁLCULO MO M ---
    const calcularMetrica = (dados) => {
        if (!dados || (!dados.receita_total && !dados.despesa_total)) return 0;
        return parseFloat(dados.receita_total || 0) - parseFloat(dados.despesa_total || 0);
    };

    const calcularDiferenca = (atual, anterior) => {
        if (anterior === 0) return { percentual: 0, icone: '➖', cor: 'gray' }; 
        
        const diferenca = atual - anterior;
        const percentual = (diferenca / Math.abs(anterior)) * 100;
        
        let icone = diferenca > 0 ? '▲' : diferenca < 0 ? '▼' : '➖';

        return { 
            percentual: percentual.toFixed(1),
            icone: icone,
            cor: diferenca > 0 ? 'green' : diferenca < 0 ? 'red' : 'gray'
        };
    };

    const lucroAtual = calcularMetrica(mesAtualData);
    const lucroAnterior = calcularMetrica(mesAnteriorData);
    const diferencaLucro = calcularDiferenca(lucroAtual, lucroAnterior);
    
    // Nomes dos meses para exibição
    const formatarNomeMes = (ano, mes) => {
        const data = new Date(ano, mes - 1, 1);
        return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const mesAtualNome = formatarNomeMes(anoSelecionado, mesSelecionado);
    const mesAnteriorNome = formatarNomeMes(getMeses(anoSelecionado, mesSelecionado).mesAnterior.ano, getMeses(anoSelecionado, mesSelecionado).mesAnterior.mes);

    // --- DADOS PARA O MODAL: PASSAMOS TODOS OS DADOS NECESSÁRIOS, INCLUINDO O LUCRO ANTERIOR ---
    const modalData = {
        lucroAtual: lucroAtual,
        lucroAnterior: lucroAnterior, // NOVO: ESSENCIAL PARA O GRÁFICO NO MODAL
        mesAtualData: mesAtualData,
        mesAnteriorData: mesAnteriorData,
        mesAtualNome: mesAtualNome,
        mesAnteriorNome: mesAnteriorNome,
        diferencaLucro: diferencaLucro,
    };


    // --- ESTILOS ---
    const destaqueCardStyle = {
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
        backgroundColor: '#e6ffee', 
        border: '3px solid #00b300',
        minWidth: '300px',
        textAlign: 'center',
        cursor: 'pointer',
    };
    
    const cardStyle = {
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        minWidth: '250px',
        textAlign: 'center',
        cursor: 'default',
    };

    const metricStyle = {
        fontSize: '3em',
        fontWeight: 'bold',
        margin: '5px 0',
        color: lucroAtual >= 0 ? '#00b300' : '#cc0000'
    };


    return (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '40px', marginBottom: '30px' }}>
            
            {/* CARD PRINCIPAL DE LUCRO (DESTAQUE) */}
            <div 
                style={destaqueCardStyle}
                onClick={() => onOpenDetalhe(modalData)} 
            >
                <h4 style={{ fontSize: '1.5em', margin: '0 0 10px 0', color: '#006600' }}>Lucro Líquido ({mesAtualNome.toUpperCase()})</h4>
                <div style={metricStyle}>
                    R$ {lucroAtual.toFixed(2)}
                </div>
                
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        color: diferencaLucro.cor
                    }}
                >
                    <span style={{ fontSize: '1.5em', marginRight: '5px' }}>{diferencaLucro.icone}</span>
                    <span>{Math.abs(diferencaLucro.percentual)}% vs {mesAnteriorNome.toUpperCase()}</span>
                </div>
                <p style={{fontSize: '0.9em', color: '#666', margin: '10px 0 0 0'}}>Performance de Lucro Mês a Mês. (Clique para Detalhes)</p>
            </div>
            
            {/* CARDS SECUNDÁRIOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Receita Bruta */}
                <div style={cardStyle}>
                    <h4>Receita Bruta ({mesAtualNome.toUpperCase()})</h4>
                    <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#007bff'}}>
                        R$ {mesAtualData?.receita_total ? parseFloat(mesAtualData.receita_total).toFixed(2) : '0.00'}
                    </div>
                    <p style={{fontSize: '0.9em', color: '#666'}}>Mês Anterior: R$ {mesAnteriorData?.receita_total ? parseFloat(mesAnteriorData.receita_total).toFixed(2) : '0.00'}</p>
                </div>

                {/* Despesa Total */}
                <div style={cardStyle}>
                    <h4>Despesa Total ({mesAtualNome.toUpperCase()})</h4>
                    <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#ff0000'}}>
                        R$ {mesAtualData?.despesa_total ? parseFloat(mesAtualData.despesa_total).toFixed(2) : '0.00'}
                    </div>
                    <p style={{fontSize: '0.9em', color: '#666'}}>Mês Anterior: R$ {mesAnteriorData?.despesa_total ? parseFloat(mesAnteriorData.despesa_total).toFixed(2) : '0.00'}</p>
                </div>
            </div>

        </div>
    );
};

export default RelatorioMensalMoM;