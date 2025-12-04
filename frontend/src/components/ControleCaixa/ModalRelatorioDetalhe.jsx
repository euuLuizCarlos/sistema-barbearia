import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ModalRelatorioDetalhe = ({ dados, onClose }) => {
    
    if (!dados) return null;

    const mesAtualData = dados.mesAtualData || {};
    const mesAnteriorData = dados.mesAnteriorData || {};
    
    const lucroAtual = parseFloat(dados.lucroAtual).toFixed(2);
    const lucroAnterior = parseFloat(dados.lucroAnterior).toFixed(2); 
    
    const receitaAtual = parseFloat(mesAtualData.receita_total || 0).toFixed(2);
    const despesaAtual = parseFloat(mesAtualData.despesa_total || 0).toFixed(2);
    const receitaAnterior = parseFloat(mesAnteriorData.receita_total || 0).toFixed(2);
    const despesaAnterior = parseFloat(mesAnteriorData.despesa_total || 0).toFixed(2);

    const mesAtual = dados.mesAtualNome.toUpperCase();
    const mesAnterior = dados.mesAnteriorNome.toUpperCase();

    const chartDataLucro = {
        labels: [mesAnterior, mesAtual],
        datasets: [
            {
                label: 'Lucro Líquido (R$)',
                data: [lucroAnterior, lucroAtual],
                backgroundColor: ['#b3d9ff', lucroAtual >= 0 ? '#00b300' : '#cc0000'],
                borderColor: ['#007bff', lucroAtual >= 0 ? '#00b300' : '#cc0000'],
                borderWidth: 1,
            },
        ],
    };
    
    const chartDataFluxo = {
        labels: ['Receita Bruta', 'Despesa Total'],
        datasets: [
            {
                label: 'Fluxo (R$)',
                data: [receitaAtual, despesaAtual],
                backgroundColor: ['#007bff', '#ff0000'],
                borderWidth: 1,
            },
        ],
    };

    const chartOptionsLucro = {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Comparação de Lucro', font: { size: 16 } },
        },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Valor (R$)' } } },
    };

    const chartOptionsFluxo = {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: `Receita vs Despesa (${mesAtual})`, font: { size: 16 } },
        },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Valor (R$)' } } },
    };


    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.8)', 
        backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 
    };

    const modalStyle = {
        background: '#fff', padding: '30px', borderRadius: '10px', width: '95%', maxWidth: '800px', 
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.7)', color: '#333', maxHeight: '90vh', overflowY: 'auto'
    };
    
    const infoStyle = {
        fontSize: '1.1em', lineHeight: '1.8', border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9'
    };


    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                
                <h2 style={{ marginBottom: '20px', borderBottom: '3px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>
                    Análise Detalhada do Mês ({mesAtual})
                </h2>

                <div style={infoStyle}>
                    <p><strong>Lucro Líquido Atual:</strong> <span style={{ color: lucroAtual >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>R$ {lucroAtual}</span></p>
                    <p><strong>Receita Bruta:</strong> R$ {receitaAtual}</p>
                    <p><strong>Despesa Total:</strong> R$ {despesaAtual}</p>
                    <hr style={{ margin: '15px 0' }}/>
                    <p><strong>Performance vs {mesAnterior}:</strong> <span style={{ color: dados.diferencaLucro.cor, fontWeight: 'bold' }}>{dados.diferencaLucro.icone} {Math.abs(dados.diferencaLucro.percentual)}%</span> de diferença no Lucro Líquido.</p>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Dados do Mês Anterior ({mesAnterior})</h3>
                <div style={{...infoStyle, fontSize: '1em', lineHeight: '1.5'}}>
                    <p>Receita: R$ {receitaAnterior}</p>
                    <p>Despesa: R$ {despesaAnterior}</p>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Visualizações Gráficas</h3>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                        <Bar data={chartDataLucro} options={chartOptionsLucro} />
                    </div>

                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                         <Bar data={chartDataFluxo} options={chartOptionsFluxo} />
                    </div>
                </div>


                <button 
                    onClick={onClose} 
                    style={{ 
                        marginTop: '30px', 
                        padding: '12px 25px', 
                        cursor: 'pointer',
                        background: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        fontWeight: 'bold'
                    }}
                >
                    Fechar Análise
                </button>
            </div>
        </div>
    );
};

export default ModalRelatorioDetalhe;