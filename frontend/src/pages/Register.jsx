// src/pages/Register.jsx (CÓDIGO FINAL E ESTILIZADO)
import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import api from '../services/api';
// Importe o logo
import barberLogo from '../assets/Gemini_Generated_Image_lkroqflkroqflkro.png';
import EscolhaTipoUsuario from '../components/Auth/EscolhaTipoUsuario'; 
import ShowPasswordToggle from '../components/ShowPasswordToggle';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const queryParams = new URLSearchParams(location.search);
    const userType = queryParams.get('type'); 

    // Estilos base do Login.jsx
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF', // Fundo branco
        color: '#333',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
    };
    const cardStyle = {
        backgroundColor: '#023047', // Cor Azul Escuro
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        maxWidth: '550px',
        width: '100%',
        boxSizing: 'border-box',
        color: '#fff' 
    };
    const inputBaseStyle = { 
        width: '100%', 
        padding: '12px 10px', 
        marginBottom: '15px', 
        border: '1px solid #455a64', 
        borderRadius: '5px', 
        fontSize: '1em', 
        backgroundColor: '#fff', 
        color: '#333' 
    };
    const buttonStyle = { 
        width: '100%', 
        padding: '12px', 
        backgroundColor: '#FFB703', // Cor Amarelo Dourado
        color: '#023047', 
        border: 'none', 
        borderRadius: '5px', 
        fontWeight: 'bold', 
        cursor: 'pointer' 
    };


    if (!userType || (userType !== 'barbeiro' && userType !== 'cliente')) {
        return <Navigate to="/escolha-perfil" replace />; 
    }

    const [message, setMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [documentoExists, setDocumentoExists] = useState(false);
    const [documentoChecking, setDocumentoChecking] = useState(false);
    const [documentoError, setDocumentoError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nome: '', email: '', password: '', tipo_usuario: userType,
        // Campos do perfil do barbeiro
        nome_barbearia: '', documento: '', telefone: '', cep: '', rua: '', numero: '', bairro: '', complemento: '', uf: '', localidade: '',
        foto_perfil: null
    });


    const handleChange = (e) => {
        const { name, value, files } = e.target;
        // limpa erros específicos ao editar campos relacionados
        if (name === 'email' && emailError) setEmailError('');
        if (name === 'password' && passwordError) setPasswordError('');
        if (name === 'documento' && documentoError) setDocumentoError('');
        if (files && files.length > 0) {
            const file = files[0];
            setFormData({ ...formData, [name]: file });
            // cria preview
            try {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
            } catch (e) {}
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            // Aplica máscaras em tempo real para alguns campos
            if (name === 'cep') {
                setFormData({ ...formData, [name]: maskCep(value) });
                return;
            }
            if (name === 'telefone') {
                setFormData({ ...formData, [name]: maskTelefone(value) });
                return;
            }
            if (name === 'documento') {
                setFormData({ ...formData, [name]: maskCpfCnpj(value) });
                return;
            }
            setFormData({ ...formData, [name]: value });
        }
    };

    // Máscaras simples para CEP / CPF-CNPJ / Telefone
    const maskCep = (value) => {
        if (!value) return '';
        const v = String(value).replace(/\D/g, '').substring(0, 8);
        return v.replace(/^(.{5})(.*)$/, (m, p1, p2) => p1 + (p2 ? '-' + p2 : ''));
    };

    const maskTelefone = (value) => {
        if (!value) return '';
        const v = String(value).replace(/\D/g, '').substring(0, 11);
        if (v.length <= 10) {
            // (99) 9999-9999
            return v.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (m, g1, g2, g3) => {
                let out = '';
                if (g1) out = `(${g1})`;
                if (g2) out += ` ${g2}`;
                if (g3) out += `-${g3}`;
                return out.replace(/-$/, '');
            });
        }
        // (99) 99999-9999
        return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    };

    const maskCpfCnpj = (value) => {
        if (!value) return '';
        const v = String(value).replace(/\D/g, '').substring(0, 14);
        if (v.length <= 11) {
            // CPF: 000.000.000-00
            return v
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        // CNPJ: 00.000.000/0000-00
        return v
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    // CEP autocomplete via ViaCEP
    const handleCepBlur = async (e) => {
        const raw = (e.target.value || '').replace(/\D/g, '');
        if (!raw || raw.length !== 8) return;
        try {
            const resp = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
            const data = await resp.json();
            if (!data || data.erro) return;
            setFormData(f => ({
                ...f,
                rua: data.logradouro || f.rua,
                bairro: data.bairro || f.bairro,
                localidade: data.localidade || f.localidade,
                uf: data.uf || f.uf,
                cep: raw
            }));
        } catch (err) {
            console.warn('Falha ao consultar CEP:', err);
        }
    };

    // Validação CPF/CNPJ (algoritmos)
    const isValidCPF = (cpf) => {
        if (!cpf) return false;
        const s = String(cpf).replace(/\D/g, '');
        if (s.length !== 11) return false;
        if (/^(\d)\1+$/.test(s)) return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(s.charAt(i)) * (10 - i);
        let rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(s.charAt(9))) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(s.charAt(i)) * (11 - i);
        rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        return rev === parseInt(s.charAt(10));
    };

    const isValidCNPJ = (cnpj) => {
        if (!cnpj) return false;
        const s = String(cnpj).replace(/\D/g, '');
        if (s.length !== 14) return false;
        if (/^(\d)\1+$/.test(s)) return false;
        const calc = (t) => {
            let sum = 0;
            let pos = t - 7;
            for (let i = t; i >= 1; i--) {
                sum += parseInt(s.charAt(t - i)) * pos--;
                if (pos < 2) pos = 9;
            }
            const res = sum % 11 < 2 ? 0 : 11 - (sum % 11);
            return res;
        };
        const digit1 = calc(12);
        const digit2 = (() => {
            const temp = s.substring(0, 12) + digit1;
            let sum = 0; let pos = 2;
            for (let i = temp.length - 1; i >= 0; i--) {
                sum += parseInt(temp.charAt(i)) * pos;
                pos = pos === 9 ? 2 : pos + 1;
            }
            return sum % 11 < 2 ? 0 : 11 - (sum % 11);
        })();
        return digit1 === parseInt(s.charAt(12)) && digit2 === parseInt(s.charAt(13));
    };

    const isValidDocumento = (doc) => {
        if (!doc) return false;
        const cleaned = String(doc).replace(/\D/g, '');
        if (cleaned.length === 11) return isValidCPF(cleaned);
        if (cleaned.length === 14) return isValidCNPJ(cleaned);
        return false;
    };

    // Checa no backend se o documento já existe
    const handleDocumentoBlur = async (e) => {
        const value = e.target.value || '';
        setDocumentoError('');
        setDocumentoExists(false);

        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) return;
        if (!isValidDocumento(cleaned)) {
            setDocumentoError('Documento inválido. CPF/CNPJ com dígitos incorretos.');
            return;
        }

        setDocumentoChecking(true);
        try {
            const resp = await api.get(`/perfil/documento-exists?documento=${cleaned}`);
            if (resp.data && resp.data.exists) {
                setDocumentoExists(true);
                setDocumentoError('Este CPF/CNPJ já está cadastrado.');
            } else {
                setDocumentoExists(false);
            }
        } catch (err) {
            console.warn('Erro ao checar documento:', err);
            setDocumentoError('Não foi possível validar o documento agora.');
        } finally {
            setDocumentoChecking(false);
        }
    };

    // Checa no backend se o email já existe
    const handleEmailBlur = async (e) => {
        const value = (e.target.value || '').trim();
        if (!value) return;
        // só checa se o formato é gmail válido (para não gerar requests desnecessários)
        const gmailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!gmailRegex.test(value)) return;

        try {
            const resp = await api.get(`/perfil/email-exists?email=${encodeURIComponent(value)}`);
            if (resp.data && resp.data.exists) {
                setEmailError('Este email já está cadastrado.');
            }
        } catch (err) {
            console.warn('Erro ao checar email:', err);
        }
    };

    // --- FUNÇÃO 1: CRIA O USUÁRIO (ETAPA 1) ---
    const handleInitialRegister = async (e) => {
        e.preventDefault();
        setMessage('Cadastrando usuário...');
        setEmailError('');
        setPasswordError('');
        setDocumentoError('');
        // Validações simples no frontend: email e senha
        const email = (formData.email || '').trim();
        const password = formData.password || '';
        // Aceita apenas emails do Gmail
        const gmailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!gmailRegex.test(email)) {
            setEmailError('Somente endereços @gmail.com são aceitos.');
            setMessage('Corrija os erros no formulário.');
            return;
        }
        if (password.length < 8) {
            setPasswordError('A senha deve ter no mínimo 8 caracteres.');
            setMessage('Corrija os erros no formulário.');
            return;
        }
        // Validações cliente-side adicionais
        if (userType === 'barbeiro') {
            // campos obrigatórios
            const required = ['nome', 'email', 'password', 'nome_barbearia', 'documento', 'telefone', 'cep', 'rua', 'numero', 'bairro', 'uf', 'localidade'];
            for (const key of required) {
                if (!formData[key] || String(formData[key]).trim() === '') {
                    setMessage('Preencha todos os campos obrigatórios do perfil da barbearia.');
                    return;
                }
            }

            if (!isValidDocumento(formData.documento)) {
                setMessage('CPF/CNPJ inválido. Verifique os dígitos.');
                return;
            }

            if (documentoExists) {
                setMessage('CPF/CNPJ já cadastrado. Use outro ou recupere acesso.');
                return;
            }
        }

        try {
            let response;

            if (userType === 'cliente') {
                const cleanedDocumento = (formData.documento || '').replace(/\D/g, '');
                if (cleanedDocumento && !isValidCPF(cleanedDocumento)) {
                    setMessage('CPF inválido. Verifique os dígitos.');
                    return;
                }

                const dadosCliente = { 
                    nome: formData.nome, 
                    email: formData.email, 
                    password: formData.password, 
                    telefone: (formData.telefone || '').replace(/\D/g, ''), 
                    documento: cleanedDocumento || undefined
                };
                response = await api.post('/auth/register/cliente', dadosCliente);
            } else {
                // Barbeiro: monta FormData para suportar upload de foto
                const fd = new FormData();
                fd.append('nome', formData.nome);
                fd.append('email', formData.email);
                fd.append('password', formData.password);
                fd.append('tipo_usuario', formData.tipo_usuario);

                // Campos do perfil (envia apenas dígitos para documento/cep/telefone)
                const cleanedDocumento = (formData.documento || '').replace(/\D/g, '');
                const cleanedCep = (formData.cep || '').replace(/\D/g, '');
                const cleanedTelefone = (formData.telefone || '').replace(/\D/g, '');

                fd.append('nome_barbearia', formData.nome_barbearia || '');
                fd.append('documento', cleanedDocumento);
                fd.append('telefone', cleanedTelefone);
                fd.append('cep', cleanedCep);
                fd.append('rua', formData.rua || '');
                fd.append('numero', formData.numero || '');
                fd.append('bairro', formData.bairro || '');
                fd.append('complemento', formData.complemento || '');
                fd.append('uf', formData.uf || '');
                fd.append('localidade', formData.localidade || '');

                if (formData.foto_perfil) {
                    fd.append('foto_perfil', formData.foto_perfil);
                }

                response = await api.post('/auth/register', fd);
            }

            // Após registro (cliente ou barbeiro) redireciona para Login — backend já ativa barbeiros
            setMessage(userType === 'cliente' ? 'Cadastro de Cliente concluído! Redirecionando para o Login...' : 'Conta criada! Redirecionando para o Login...');
            setTimeout(() => navigate('/login'), 2000);
            // Se o registro foi feito e havia preview, libera o objeto URL
            if (previewUrl) {
                try { URL.revokeObjectURL(previewUrl); } catch (e) {}
                setPreviewUrl(null);
            }

        } catch (error) {
            const respErrors = error.response?.data?.errors;
            if (respErrors && typeof respErrors === 'object') {
                if (respErrors.email) setEmailError(respErrors.email);
                if (respErrors.password) setPasswordError(respErrors.password);
                if (respErrors.documento) setDocumentoError(respErrors.documento);
                // mensagem geral
                if (respErrors.general) setMessage(respErrors.general);
                else {
                    const first = respErrors.email || respErrors.password || respErrors.documento || respErrors.nome || respErrors.general;
                    if (first) setMessage(first);
                }
            } else {
                const errorMessage = error.response?.data?.error || 'Erro no cadastro. Verifique a conexão.';
                setMessage(errorMessage);
            }
        }
    };
    
    // --- INTERFACES DE RENDERIZAÇÃO ---
    

    // Interface do formulário de Registro (ETAPA 1)
    const renderRegistrationForm = () => (
        <form onSubmit={handleInitialRegister} style={{ marginTop: '30px' }} key="form-step-1" encType="multipart/form-data">
            <h2 style={{ margin: '0', fontSize: '1.5em', color: '#FFB703' }}>Registro como {userType.toUpperCase()}</h2>
            <p style={{ margin: '5px 0 30px 0', fontSize: '0.9em', color: '#ccc' }}>Crie sua conta {userType} agora.</p>

            <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome Completo" required style={inputBaseStyle} />
            <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleEmailBlur} placeholder="Email" required style={inputBaseStyle} />
            {emailError && <p style={{ margin: '6px 0', color: '#fff', background: '#c62828', padding: '6px', borderRadius: '4px' }}>{emailError}</p>}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Senha"
                    required
                    style={{ ...inputBaseStyle, paddingRight: '40px', marginBottom: '0' }}
                />
                <ShowPasswordToggle show={showPassword} onToggle={() => setShowPassword(s => !s)} ariaLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {passwordError && <p style={{ margin: '6px 0', color: '#fff', background: '#c62828', padding: '6px', borderRadius: '4px' }}>{passwordError}</p>}

            {userType === 'cliente' && (
                <div style={{ marginTop: '10px', background: '#fff', padding: '12px', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0, color: '#023047' }}>Dados Pessoais</h3>
                    <input type="text" name="documento" value={formData.documento} onChange={handleChange} onBlur={handleDocumentoBlur} placeholder="CPF" style={inputBaseStyle} />
                    {documentoChecking && <p style={{ margin: '6px 0', color: '#666' }}>Validando documento...</p>}
                    {documentoError && <p style={{ margin: '6px 0', color: '#ffdddd', background: '#a00', padding: '6px', borderRadius: '4px' }}>{documentoError}</p>}
                    <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone" style={inputBaseStyle} />
                </div>
            )}

            {userType === 'barbeiro' && (
                <div style={{ marginTop: '10px', background: '#fff', padding: '12px', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0, color: '#023047' }}>Dados da Barbearia</h3>
                    <input type="text" name="nome_barbearia" value={formData.nome_barbearia} onChange={handleChange} placeholder="Nome da Barbearia" required style={inputBaseStyle} />
                    <input type="text" name="documento" value={formData.documento} onChange={handleChange} onBlur={handleDocumentoBlur} placeholder="CPF/CNPJ" required style={inputBaseStyle} />
                    {documentoChecking && <p style={{ margin: '6px 0', color: '#666' }}>Validando documento...</p>}
                    {documentoError && <p style={{ margin: '6px 0', color: '#ffdddd', background: '#a00', padding: '6px', borderRadius: '4px' }}>{documentoError}</p>}
                    <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone" required style={inputBaseStyle} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="CEP" required style={{ ...inputBaseStyle, flex: '1 1 150px' }} />
                        <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Número" required style={{ ...inputBaseStyle, flex: '1 1 120px' }} />
                    </div>
                    <input type="text" name="rua" value={formData.rua} onChange={handleChange} placeholder="Rua" required style={inputBaseStyle} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Bairro" required style={{ ...inputBaseStyle, flex: '1' }} />
                        <input type="text" name="localidade" value={formData.localidade} onChange={handleChange} placeholder="Cidade" required style={{ ...inputBaseStyle, flex: '1' }} />
                        <input type="text" name="uf" value={formData.uf} onChange={handleChange} placeholder="UF" required style={{ width: '80px', padding: '12px' }} />
                    </div>
                    <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Complemento (opcional)" style={inputBaseStyle} />

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Foto da Barbearia (opcional)</label>
                    <input type="file" name="foto_perfil" accept="image/*" onChange={handleChange} style={{ marginBottom: '10px' }} />
                    {previewUrl && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ margin: 0, fontSize: '0.9em', color: '#333' }}>Pré-visualização da foto selecionada:</p>
                            <img src={previewUrl} alt="preview" style={{ marginTop: '8px', maxWidth: '120px', maxHeight: '120px', borderRadius: '6px', border: '1px solid #ccc' }} />
                        </div>
                    )}
                </div>
            )}

            <button type="submit" style={{ ...buttonStyle, fontSize: '1.1em', padding: '12px 10px' }}>
                {userType === 'cliente' ? 'Finalizar Cadastro' : 'Criar Conta e Preencher Perfil'}
            </button>
        </form>
    );
    

    return (
        <div style={containerStyle}>
            
            {/* CONTAINER CENTRAL (O "QUADRADO AZUL") */}
            <div style={cardStyle}>
                
                {/* ÁREA DO LOGO E TÍTULO */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <img src={barberLogo} alt="BarberApp Logo" style={{ width: '90%', height: 'auto', margin: '0 0 15px 0' }} />
                </div>

                {/* Formulário de Registro */}
                {renderRegistrationForm()}
                
                {/* Mensagens de Status */}
                {message && (
                    <p style={{ marginTop: '20px', color: message.includes('sucesso') ? '#90ee90' : (message.includes('Verificando') ? '#fff' : '#ff9999'), fontWeight: 'bold', fontSize: '0.9em' }}>
                        {message}
                    </p>
                )}
                
                <p style={{ marginTop: '30px', fontSize: '0.9em', borderTop: '1px solid #455a64', padding: '10px 0 0 0' }}>
                    <Link to="/login" style={{ color: '#FFB703', textDecoration: 'none', fontWeight: 'bold' }}>
                        Já tem conta? Faça Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;