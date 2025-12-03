import React from 'react';
import { FaTimes, FaFileAlt } from 'react-icons/fa';

const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    SUCCESS: '#4CAF50',
    ERROR: '#cc0000',
    SECONDARY_TEXT: '#888888',
    BACKGROUND_LIGHT: '#f8f8f8',
};

const TermosDeUso = ({ onClose }) => {
    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 3000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '10px',
                    width: '90%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 0 30px rgba(0,0,0,0.3)',
                    padding: '30px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${COLORS.PRIMARY}`, paddingBottom: '15px' }}>
                    <h2 style={{ margin: 0, color: COLORS.PRIMARY, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaFileAlt /> Termos de Uso e Política de Privacidade
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: COLORS.PRIMARY,
                            fontSize: '24px'
                        }}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Conteúdo dos Termos */}
                <div style={{ lineHeight: '1.8', color: '#333', fontSize: '14px' }}>
                    <h3 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>TERMOS DE USO E POLÍTICA DE PRIVACIDADE</h3>
                    
                    <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
                        Bem-vindo(a) à <strong>Sistema de Barbearia</strong>!
                    </p>
                    
                    <p style={{ marginBottom: '15px' }}>
                        Estes Termos de Uso regem o acesso e a utilização dos serviços oferecidos por <strong>Sistema de Barbearia</strong>, disponível através do website ou aplicativo web.
                    </p>
                    
                    <p style={{ marginBottom: '20px' }}>
                        Ao acessar ou utilizar nossos serviços, você concorda com estes termos.
                    </p>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>1. Aceitação dos Termos</h4>
                    <p style={{ marginBottom: '20px' }}>
                        Ao criar uma conta ou utilizar qualquer funcionalidade da nossa aplicação, você declara ter lido, compreendido e aceitado integralmente os presentes Termos de Uso e nossa Política de Privacidade. Caso não concorde com qualquer disposição aqui presente, você não deve utilizar nossos serviços.
                    </p>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>2. Uso do Serviço</h4>
                    <p style={{ marginBottom: '20px' }}>
                        Você concorda em utilizar a aplicação de forma lícita, respeitando a legislação vigente, a moral e os bons costumes, e abstendo-se de praticar qualquer ato que possa prejudicar o funcionamento da aplicação ou os direitos de terceiros.
                    </p>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>3. Coleta e Tratamento de Dados Pessoais (LGPD)</h4>
                    <p style={{ marginBottom: '15px' }}>
                        A <strong>Sistema de Barbearia</strong> está comprometida com a segurança e a privacidade dos seus dados. Coletamos e tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD) (Lei nº 13.709/2018).
                    </p>

                    <h5 style={{ color: COLORS.ACCENT, marginTop: '15px', marginBottom: '10px' }}>3.1. Dados Coletados</h5>
                    <p style={{ marginBottom: '10px' }}>Coletamos os seguintes tipos de informações:</p>
                    <ul style={{ marginBottom: '15px', marginLeft: '20px' }}>
                        <li><strong>Dados Cadastrais:</strong> Nome completo, e-mail, telefone, endereço e CPF (Cadastro de Pessoas Físicas).</li>
                        <li><strong>Dados de Uso:</strong> Informações sobre como você interage com a aplicação.</li>
                        <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional.</li>
                    </ul>

                    <h5 style={{ color: COLORS.ACCENT, marginTop: '15px', marginBottom: '10px' }}>3.2. Finalidade da Coleta do CPF</h5>
                    <p style={{ marginBottom: '10px' }}>O CPF é coletado estritamente para as seguintes finalidades, baseadas em bases legais previstas na LGPD:</p>
                    <ul style={{ marginBottom: '15px', marginLeft: '20px' }}>
                        <li><strong>Identificação e Autenticação:</strong> Para confirmar sua identidade e garantir a segurança do seu acesso à conta.</li>
                        <li><strong>Emissão de Documentos Fiscais:</strong> Para gerar notas fiscais de serviços ou produtos adquiridos, conforme exigência legal brasileira.</li>
                        <li><strong>Prevenção a Fraudes:</strong> Para validar informações cadastrais e prevenir atividades fraudulentas.</li>
                        <li><strong>Cumprimento de Obrigações Legais/Regulatórias:</strong> Para reportar informações a órgãos governamentais, se necessário.</li>
                    </ul>

                    <h5 style={{ color: COLORS.ACCENT, marginTop: '15px', marginBottom: '10px' }}>3.3. Consentimento</h5>
                    <p style={{ marginBottom: '15px' }}>
                        Ao fornecer seu CPF e aceitar estes termos, você consente de forma livre, informada e inequívoca com a coleta e o tratamento dos dados para as finalidades acima descritas.
                    </p>

                    <h5 style={{ color: COLORS.ACCENT, marginTop: '15px', marginBottom: '10px' }}>3.4. Direitos do Titular dos Dados</h5>
                    <p style={{ marginBottom: '10px' }}>Você pode, a qualquer momento e mediante solicitação, exercer seus direitos previstos na LGPD, incluindo:</p>
                    <ul style={{ marginBottom: '15px', marginLeft: '20px' }}>
                        <li>Confirmação da existência de tratamento dos seus dados;</li>
                        <li>Acesso aos dados;</li>
                        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                        <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                        <li>Revogação do consentimento.</li>
                    </ul>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>4. Compartilhamento de Informações</h4>
                    <p style={{ marginBottom: '15px' }}>
                        A <strong>Sistema de Barbearia</strong> não vende ou aluga seus dados pessoais. Podemos compartilhar seus dados, incluindo o CPF, apenas com:
                    </p>
                    <ul style={{ marginBottom: '15px', marginLeft: '20px' }}>
                        <li><strong>Parceiros de negócio e prestadores de serviço</strong> (ex: gateways de pagamento, serviços de hospedagem) estritamente para a execução dos serviços contratados e sob rigoroso dever de confidencialidade.</li>
                        <li><strong>Autoridades judiciais, administrativas ou governamentais competentes,</strong> sempre que houver determinação legal, requerimento ou ordem judicial.</li>
                    </ul>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>5. Segurança da Informação</h4>
                    <p style={{ marginBottom: '20px' }}>
                        Adotamos medidas técnicas e organizacionais para proteger seus dados pessoais contra acessos não autorizados, destruição, perda, alteração, comunicação ou difusão indevida. No entanto, nenhuma transmissão via internet é 100% segura, e você também deve proteger suas credenciais de acesso.
                    </p>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>6. Disposições Finais</h4>
                    <p style={{ marginBottom: '20px' }}>
                        Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento, mediante notificação aos usuários. O uso continuado dos serviços após tais modificações constituirá sua aceitação dos termos alterados.
                    </p>

                    <h4 style={{ color: COLORS.PRIMARY, marginTop: '20px', marginBottom: '10px' }}>7. Contato</h4>
                    <p style={{ marginBottom: '20px' }}>
                        Para quaisquer dúvidas relacionadas a estes Termos de Uso ou à nossa Política de Privacidade, entre em contato conosco através do suporte da aplicação.
                    </p>

                    <div style={{ backgroundColor: COLORS.BACKGROUND_LIGHT, padding: '15px', borderRadius: '5px', marginTop: '30px', borderLeft: `4px solid ${COLORS.ACCENT}` }}>
                        <p style={{ margin: 0, fontSize: '12px', color: COLORS.SECONDARY_TEXT }}>
                            <strong>Última atualização:</strong> 3 de dezembro de 2025
                        </p>
                    </div>
                </div>

                {/* Botão de Fechar */}
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 30px',
                            backgroundColor: COLORS.PRIMARY,
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        <FaTimes style={{ marginRight: '8px' }} /> Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermosDeUso;
