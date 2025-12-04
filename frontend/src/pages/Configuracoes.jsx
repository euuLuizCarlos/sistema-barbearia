// src/pages/Configuracoes.jsx (CÓDIGO FINAL E CORRIGIDO)

import React, { useState } from 'react';
// Importa o componente de controle de caixa
import ConfiguracaoTaxaMaquininha from "../components/ControleCaixa/ConfiguracaoTaxaMaquininha";
import GerenciarMaquininhas from "../components/ControleCaixa/GerenciarMaquininhas";
// 🚨 CAMINHO CORRIGIDO: Assume que o arquivo está em src/components/Configuracoes
import GerenciarDiasBloqueados from "../components/Configuracoes/GerenciarDiasBloqueados.jsx"; 
import TermosDeUso from "../components/TermosDeUso.jsx"; 


const PRIMARY_COLOR = '#023047';
const ACCENT_COLOR = '#FFB703';

const Configuracoes = () => {
    // 💡 ESTADO: Qual seção deve ser exibida? ('taxa', 'maquininhas', 'bloqueios', ou null)
    const [secaoAtiva, setSecaoAtiva] = useState(null);
    const [mostrarTermos, setMostrarTermos] = useState(false); 
    
    // --- FUNÇÃO AUXILIAR PARA RENDERIZAÇÃO ---
    const renderSecao = () => {
        switch (secaoAtiva) {
            case 'taxa':
                // Passamos uma função para fechar a seção após a ação ou ao clicar no botão Fechar
                return <ConfiguracaoTaxaMaquininha onCancel={() => setSecaoAtiva(null)} />;
            case 'maquininhas':
                return <GerenciarMaquininhas onCancel={() => setSecaoAtiva(null)} />;
            case 'bloqueios':
                return <GerenciarDiasBloqueados onCancel={() => setSecaoAtiva(null)} />;
            default:
                return (
                    <p style={{ marginTop: '20px', color: '#555', fontSize: '1.1em' }}>
                        Selecione uma opção de configuração acima para visualizar os painéis de gestão.
                    </p>
                );
        }
    };
    
    // --- ESTILOS DOS BOTÕES DE NAVEGAÇÃO ---
    const linkStyle = (active) => ({
        padding: '15px 25px',
        margin: '0 10px',
        borderRadius: '8px',
        backgroundColor: active ? PRIMARY_COLOR : '#fff',
        color: active ? ACCENT_COLOR : PRIMARY_COLOR,
        border: `1px solid ${PRIMARY_COLOR}`,
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: active ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none',
    });


    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', color: PRIMARY_COLOR }}>
                Configurações do Sistema
            </h1>
            
            {/* 💡 CONTROLES DE NAVEGAÇÃO SUPERIOR (Botões Clicáveis) */}
            <div style={{ display: 'flex', marginBottom: '30px', marginTop: '30px', flexWrap: 'wrap', gap: '10px' }}>
                
                <div 
                    style={linkStyle(secaoAtiva === 'bloqueios')} 
                    onClick={() => setSecaoAtiva('bloqueios')}
                >
                    <span style={{ fontSize: '1.2em' }}>📅</span> Gerenciar Dias Bloqueados
                </div>
                
                <div 
                    style={linkStyle(secaoAtiva === 'maquininhas')} 
                    onClick={() => setSecaoAtiva('maquininhas')}
                >
                    <span style={{ fontSize: '1.2em' }}>🏪</span> Gerenciar Maquininhas
                </div>

                <div 
                    style={linkStyle(false)} 
                    onClick={() => setMostrarTermos(true)}
                >
                    <span style={{ fontSize: '1.2em' }}>📄</span> Termos de Uso
                </div>
                
            </div>
            
            <hr style={{ margin: '0', borderColor: '#ccc' }}/>

            {/* 💡 ÁREA DE RENDERIZAÇÃO CONDICIONAL */}
            <div style={{ paddingTop: '20px' }}>
                {renderSecao()}
            </div>

            {/* 💡 MODAL DE TERMOS DE USO */}
            {mostrarTermos && <TermosDeUso onClose={() => setMostrarTermos(false)} />}
            
        </div>
    );
};

export default Configuracoes;