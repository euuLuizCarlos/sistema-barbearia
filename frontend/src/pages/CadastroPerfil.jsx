import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import axios from 'axios'; 
import { useAuth } from '../contexts/AuthContext'; // <--- CORREÇÃO: AGORA É SOMENTE UM NÍVEL ACIMA
import { FaSave, FaTimesCircle, FaUserCog, FaHome, FaUserCircle } from 'react-icons/fa'; 

// --- FUNÇÕES DE MÁSCARA, VALIDAÇÃO E UFS ---
const UFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Funções de máscara... (MANTIDAS)
const maskCep = (value) => { 
    if (!value) return ""; 
    value = value.toString().replace(/\D/g, "").substring(0, 8); 
    if (value.length > 5) { 
        value = value.replace(/^(\d{5})(\d)/, "$1-$2"); 
    } 
    return value; 
};

const maskCpfCnpj = (value) => { 
    if (!value) return ""; 
    value = value.toString().replace(/\D/g, "");
    
    if (value.length <= 11) { // CPF
        value = value.replace(/(\d{3})(\d)/, "$1.$2")
                     .replace(/(\d{3})(\d)/, "$1.$2")
                     .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else { // CNPJ
        value = value.substring(0, 14);
        value = value.replace(/^(\d{2})(\d)/, "$1.$2")
                     .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                     .replace(/\.(\d{3})(\d)/, ".$1/$2")
                     .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value; 
};

const validateCep = (cep) => /^\d{5}-?\d{3}$/.test(cep);
const validateCpfCnpj = (doc) => { 
    const cleaned = doc.toString().replace(/\D/g, ''); 
    return cleaned.length === 11 || cleaned.length === 14; 
};

// --- FUNÇÃO DE INICIALIZAÇÃO SEGURA ---
const getInitialFormData = (user) => ({
    // Dados do usuário logado (não editáveis)
    nome_barbeiro: user?.userName || '', 
    email: user?.email || '',
    
    // Dados do Perfil (editáveis - inicializados como vazio)
    nome_barbearia: '', 
    documento: '', 
    telefone: '', 
    rua: '', 
    numero: '', 
    bairro: '', 
    complemento: '', 
    cep: '', 
    uf: '', 
    localidade: ''
});


const CadastroPerfil = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    
    // Inicializa o estado com o objeto completo e os dados do usuário assim que carregado
    const [formData, setFormData] = useState(getInitialFormData(user)); 
    
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [apiError, setApiError] = useState(''); 
    const [validationErrors, setValidationErrors] = useState({});
    const [isEditingExisting, setIsEditingExisting] = useState(false); 

    // Estados para Foto
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoUrl, setFotoUrl] = useState(''); 
    const [loadingFoto, setLoadingFoto] = useState(false);
    
    
    // --- FUNÇÃO DE BUSCA (Para pré-preencher em caso de EDIÇÃO) ---
    const fetchProfileForEditing = useCallback(async () => {
        // Se o usuário ainda não carregou ou não é barbeiro, sai
        if (!user || user.userType !== 'barbeiro') {
            setLoading(false);
            return;
        }

        setLoading(true);
        setApiError('');
        try {
            // Rota GET /perfil/barbeiro
            const response = await api.get('/perfil/barbeiro');
            const { profileExists, data } = response.data;
            
            // 1. Dados Base do usuário logado
            const baseData = getInitialFormData(user); 
            
            if (profileExists && data) {
                // MODO EDIÇÃO: Preenche com dados do DB
                data.documento = maskCpfCnpj(data.documento);
                data.cep = maskCep(data.cep);
                setFormData({ ...baseData, ...data });
                setIsEditingExisting(true); 
                
                if (data.foto_perfil) {
                    setFotoUrl(data.foto_perfil);
                }
            } else {
                // MODO CADASTRO: Usa os dados base (campos editáveis vazios)
                setFormData(baseData);
                setIsEditingExisting(false);
                if (data.foto_perfil) {
                    setFotoUrl(data.foto_perfil);
                }
            }
        } catch (err) {
            setApiError("Erro ao carregar dados. Verifique a API.");
            setFormData(getInitialFormData(user)); // Se falhar, garante o estado base
        } finally {
            setLoading(false); // Garante que o loading para
        }
    }, [user]); 

    // Efeito: Chamado apenas quando o objeto 'user' (logado) é carregado/alterado
    useEffect(() => {
        if (user && user.userType === 'barbeiro') {
            fetchProfileForEditing();
        } else if (user && user.userType !== 'barbeiro') {
             setLoading(false); // Não é barbeiro, não precisa buscar
        }
    }, [user, fetchProfileForEditing]); 
    
    
    // --- FUNÇÕES DE EVENTO ---
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFotoFile(file);
        if (file) {
            setFotoUrl(URL.createObjectURL(file)); 
        }
    };
    
    const handleUploadFoto = async () => {
        if (!fotoFile) {
            alert('Por favor, selecione uma foto antes de fazer o upload.');
            return;
        }

        setLoadingFoto(true);
        setMessage('Enviando foto...');
        setApiError('');

        const data = new FormData();
        data.append('foto_perfil', fotoFile); 

        try {
            const response = await api.put('/perfil/foto', data);
            
            setFotoUrl(response.data.foto_perfil_url); 
            setMessage('Foto de perfil salva com sucesso!');
            setFotoFile(null); 
            
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error.response?.data);
            setApiError(error.response?.data?.error || 'Falha ao enviar a foto.');
        } finally {
            setLoadingFoto(false);
        }
    };
    
    const checkCep = async (cep) => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;
        setMessage('Buscando endereço...');
        setApiError('');
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = response.data;
            if (data.erro) { setApiError('CEP não encontrado. Preencha manualmente.'); setMessage(''); return; }
            setFormData(prev => ({
                ...prev, rua: data.logradouro || '', bairro: data.bairro || '', uf: data.uf || '', localidade: data.localidade || '',
            }));
            setMessage('Endereço preenchido automaticamente.');
        } catch (error) { setApiError('Erro ao consultar CEP.'); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        
        // MÁSCARAS
        if (name === 'documento') newValue = maskCpfCnpj(value);
        if (name === 'cep') { newValue = maskCep(value); if (newValue.length === 9) checkCep(newValue); }
        
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (apiError) setApiError('');
        if (validationErrors[name]) { setValidationErrors(prev => ({ ...prev, [name]: null })); }
    };
    
    // --- SUBMISSÃO DO FORMULÁRIO DE TEXTO (POST /perfil/barbeiro) ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('Salvando alterações...');
        setApiError(''); 
        setValidationErrors({});
        
        // 1. Validação de campos obrigatórios
        const requiredFields = ['nome_barbearia', 'telefone', 'rua', 'numero', 'bairro', 'cep', 'uf', 'localidade', 'nome_barbeiro', 'documento'];
        const missingFields = requiredFields.filter(field => !formData[field] || String(formData[field]).trim() === '');
        
        if (missingFields.length > 0) {
             setApiError('Preencha todos os campos obrigatórios (*).');
             return;
        }

        if (!validateCpfCnpj(formData.documento) || !validateCep(formData.cep)) {
             setApiError('Corrija o formato do CEP e/ou CPF/CNPJ.');
             return;
        }
        
        // 2. Preparação dos Dados (Limpeza de máscaras)
        try {
            const dadosParaEnviar = {
                ...formData,
                documento: formData.documento.replace(/\D/g, ''), 
                cep: formData.cep.replace(/\D/g, ''), 
                barbeiro_id: user?.userId 
            };
            
            // Rota POST para salvar dados de texto (usa ON DUPLICATE KEY UPDATE no backend)
            await api.post('/perfil/barbeiro', dadosParaEnviar); 
            
            setMessage('Perfil salvo com sucesso! Redirecionando...');

            setTimeout(() => {
                navigate('/meu-perfil', { replace: true });
            }, 500); 

        } catch (err) {
            let apiErrorMessage = err.response?.data?.error || 'Erro ao atualizar. Verifique sua conexão ou se o CPF/CNPJ já está cadastrado.';
            setApiError(apiErrorMessage);
        }
    };
    
    // --- RENDERIZAÇÃO ---
    // Checagem final de carregamento
    if (loading || !user) { return <h2 style={{ padding: '50px', textAlign: 'center' }}>Carregando dados do usuário...</h2>; }
    if (user.userType !== 'barbeiro') { return <h2 style={{ padding: '50px', textAlign: 'center', color: 'red' }}>Acesso Negado: Apenas barbeiros podem cadastrar perfis.</h2>; }

    
    // Estilos internos...
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const errorStyle = { color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' };
    const disabledInputStyle = { ...inputStyle, backgroundColor: '#eee', cursor: 'not-allowed' };
    const columnLayout = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' };

    const fotoSource = fotoUrl ? (fotoUrl.startsWith('/uploads') ? `http://localhost:3000${fotoUrl}` : fotoUrl) : null;


    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            <h1 style={{ borderBottom: '2px solid #023047', paddingBottom: '10px', marginBottom: '30px', color: '#023047', position: 'relative' }}>
                <FaUserCog style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                {isEditingExisting ? 'Edição de Perfil' : 'Cadastro Inicial de Perfil Profissional *'}

                {/* BOTÃO VOLTAR AO DASHBOARD */}
                <button 
                    type="button" 
                    onClick={() => navigate('/', { replace: true })} 
                    style={{ position: 'absolute', right: '0', top: '0', padding: '8px 15px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}
                >
                    <FaHome style={{ marginRight: '5px' }} /> Dashboard
                </button>
            </h1>
            
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {apiError && <div style={{ color: 'red', marginBottom: '15px' }}>{apiError}</div>}
            
            {/* BLOCO DE UPLOAD DE FOTO */}
            <div style={{ textAlign: 'center', marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h3 style={{ color: '#023047', marginBottom: '15px' }}>Foto de Perfil</h3>
                
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 15px auto', border: '4px solid #FFB703', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {fotoSource ? (
                        <img src={fotoSource} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    ) : (
                        <FaUserCircle size={80} color="#ccc" />
                    )}
                </div>
                
                <input type="file" name="foto_perfil" accept="image/*" onChange={handleFileChange} disabled={loadingFoto} style={{ display: 'block', margin: '0 auto 10px auto', fontSize: '1em' }}/>
                
                <button type="button" onClick={handleUploadFoto} disabled={!fotoFile || loadingFoto} style={{ padding: '8px 20px', backgroundColor: loadingFoto ? '#ccc' : '#023047', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    {loadingFoto ? 'Enviando...' : 'Salvar Nova Foto'}
                </button>
            </div>
            {/* FIM DO BLOCO DE UPLOAD DE FOTO */}

            <form onSubmit={handleUpdate} style={{ padding: '0 30px' }}>
                <div style={columnLayout}>
                    
                    {/* COLUNA ESQUERDA */}
                    <div>
                        <label>Nome do Barbeiro</label>
                        {/* NOME E EMAIL VÊM DO AUTH CONTEXT E SÃO DESABILITADOS */}
                        <input type="text" name="nome_barbeiro" value={formData.nome_barbeiro || ''} style={disabledInputStyle} disabled={true} />
                        
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email || ''} style={disabledInputStyle} disabled={true} />
                        
                        <label>CPF/CNPJ *</label>
                        <input type="text" name="documento" value={formData.documento || ''} onChange={handleChange} style={isEditingExisting ? disabledInputStyle : inputStyle} disabled={isEditingExisting} required />
                        {validationErrors.documento && <div style={errorStyle}>{validationErrors.documento}</div>}

                        <label>Nome da Barbearia *</label>
                        <input type="text" name="nome_barbearia" value={formData.nome_barbearia || ''} onChange={handleChange} style={inputStyle} required />
                        
                        <label>Telefone *</label>
                        <input type="text" name="telefone" value={formData.telefone || ''} onChange={handleChange} style={inputStyle} required />
                        
                        <label>CEP *</label>
                        <input type="text" name="cep" value={formData.cep || ''} onChange={handleChange} style={inputStyle} required />
                        {validationErrors.cep && <div style={errorStyle}>{validationErrors.cep}</div>}
                    </div>

                    {/* COLUNA DIREITA (Endereço) */}
                    <div>
                        <label>Rua *</label>
                        <input type="text" name="rua" value={formData.rua || ''} onChange={handleChange} style={inputStyle} required />

                        <label>Número *</label>
                        <input type="text" name="numero" value={formData.numero || ''} onChange={handleChange} style={inputStyle} required />

                        <label>Bairro *</label>
                        <input type="text" name="bairro" value={formData.bairro || ''} onChange={handleChange} style={inputStyle} required />

                        <label>Cidade *</label>
                        <input type="text" name="localidade" value={formData.localidade || ''} onChange={handleChange} style={inputStyle} required />
                        
                        <label>UF *</label>
                        <select name="uf" value={formData.uf || ''} onChange={handleChange} style={inputStyle} required>
                            <option value="">Selecione a UF</option>
                            {UFs.map(uf => <option key={uf} value={uf}>{uf}</option>)} 
                        </select>
                        
                        <label>Complemento (Opcional)</label>
                        <input type="text" name="complemento" value={formData.complemento || ''} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button type="submit" style={{ padding: '12px 30px', backgroundColor: '#023047', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '15px' }}>
                        <FaSave style={{ marginRight: '10px' }} />
                        {isEditingExisting ? 'Salvar Edição' : 'Concluir Cadastro'}
                    </button>
                    
                    {isEditingExisting && (
                        <button type="button" onClick={() => navigate('/meu-perfil', { replace: true })} style={{ padding: '12px 30px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            <FaTimesCircle style={{ marginRight: '10px' }} />
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CadastroPerfil;