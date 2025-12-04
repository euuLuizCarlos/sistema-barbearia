// src/components/Agendamento/ModalConfirmacao.jsx

import React, { useState } from 'react';
import { FaCalendarAlt, FaClock, FaDollarSign, FaUserCircle, FaTimes, FaCheckCircle, FaChevronLeft } from 'react-icons/fa';

const ModalConfirmacao = ({ 
    onClose, 
    onConfirm, 
    agendamentoData 
}) => {
    // Estado para a observação (campo de texto)
    const [observacao, setObservacao] = useState('');
    
    // Estado para a opção "Não quero conversar" (simulando um toggle)
    const [naoConversar, setNaoConversar] = useState(false);

    // Se os dados não existirem, não renderiza
    if (!agendamentoData) return null;

    const { 
        barbeiro, 
        servico, 
        data: dateObject, 
        horaSelecionada 
    } = agendamentoData;
    
    // Calcula o horário final (DURAÇÃO + HORA INÍCIO)
    const duracaoMinutos = servico.duracao_minutos;
    const [h, m] = horaSelecionada.split(':').map(Number);
    
    const horaFim = new Date(dateObject);
    horaFim.setHours(h, m, 0); 
    horaFim.setMinutes(horaFim.getMinutes() + duracaoMinutos);
    
    const horaFimFormatada = horaFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Estilos base
    const primaryColor = '#023047';
    const accentColor = '#FFB703';
    
    // Funções de formatação
    const formatPrice = (price) => `R$ ${parseFloat(price).toFixed(2)}`;
    const formatDate = (date) => date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const dateFormatted = formatDate(dateObject);


    const handleFinalConfirm = () => {
        // Envia todos os dados adicionais para a função de agendamento final
        onConfirm(horaSelecionada, {
            observacao,
            preferencia: naoConversar ? 'Não Conversar' : 'Conversar'
        });
    };

    return (
        // Overlay do Modal
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            
            {/* Conteúdo Principal do Modal */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '450px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', color: primaryColor }}>

                {/* BOTÃO DE FECHAR (VOLTAR) */}
                <button onClick={onClose} style={{ background: 'none', border: 'none', float: 'left', color: primaryColor, cursor: 'pointer', fontSize: '1.5em', marginBottom: '15px' }}>
                    <FaChevronLeft />
                </button>
                <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.5em', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    Confirmar Agendamento
                </h3>
                
                {/* INFORMAÇÕES DE DESTAQUE */}
                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: `5px solid ${accentColor}` }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <img src={barbeiro.foto_url || 'https://placehold.co/40/eee/333?text=B'} alt={barbeiro.nome} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{barbeiro.nome}</p>
                            <p style={{ margin: 0, fontSize: '0.8em', color: '#555' }}>{barbeiro.nome_barbearia || 'Barbearia sem nome'}</p>
                        </div>
                    </div>

                    <p style={{ margin: '15px 0 0 0', fontWeight: 'bold', fontSize: '1.1em' }}>
                        <FaCheckCircle style={{ color: 'green', marginRight: '5px' }}/> {servico.nome}
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: primaryColor }}>
                        <FaClock style={{ marginRight: '5px' }}/> **{horaSelecionada} - {horaFimFormatada}** ({duracaoMinutos} min)
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: primaryColor }}>
                        <FaCalendarAlt style={{ marginRight: '5px' }}/> **{dateFormatted}**
                    </p>
                    <p style={{ margin: '15px 0 0 0', fontWeight: 'bold', color: 'green', fontSize: '1.2em' }}>
                        <FaDollarSign style={{ marginRight: '5px' }}/> {formatPrice(servico.preco)}
                    </p>
                </div>

                {/* OPÇÕES ADICIONAIS (COMO NA FOTO) */}
                
                {/* Não Quero Conversar (Toggle) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#e0e0e0', borderRadius: '5px', marginBottom: '15px' }}>
                    <span>Não quero conversar durante o atendimento</span>
                    <input type="checkbox" checked={naoConversar} onChange={(e) => setNaoConversar(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.5)' }}/>
                </div>
                
                {/* Observações */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 5px 0' }}>Alguma observação?</p>
                    <textarea 
                        value={observacao} 
                        onChange={(e) => setObservacao(e.target.value)} 
                        placeholder="Ex: Não precisa lavar, etc."
                        rows="3"
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', resize: 'none' }}
                    />
                </div>

                {/* BOTÃO DE CONFIRMAÇÃO FINAL */}
                <button 
                    onClick={handleFinalConfirm}
                    style={{ width: '100%', padding: '15px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em' }}
                >
                    Confirmar agendamento
                </button>

            </div>
        </div>
    );
};

export default ModalConfirmacao;