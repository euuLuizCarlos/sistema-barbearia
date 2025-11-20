import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';

const maskCpf = (value) => {
    if (!value) return '';
    const v = String(value).replace(/\D/g, '').substring(0,11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, (m,p1,p2,p3,p4) => `${p1}.${p2}.${p3}-${p4}`).replace(/\.$/, '');
};

const maskTelefone = (value) => {
    if (!value) return '';
    const v = String(value).replace(/\D/g, '').substring(0,11);
    if (v.length <= 10) {
        return v.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (m,g1,g2,g3) => {
            let out=''; if (g1) out=`(${g1})`; if (g2) out+=` ${g2}`; if (g3) out+=`-${g3}`; return out.replace(/-$/,'');
        });
    }
    return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
};

const EditarPerfilCliente = () => {
    const { user } = useAuth();
    const ui = useUi();
    const navigate = useNavigate();

    const [form, setForm] = useState({ nome: '', email: '', telefone: '', documento: '' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const resp = await api.get('/perfil/cliente');
                const data = resp.data.data || {};
                setForm({
                    nome: data.nome || user?.userName || '',
                    email: data.email || user?.email || '',
                    telefone: data.telefone || '',
                    documento: data.documento || ''
                });
            } catch (err) {
                ui.showPostIt('Não foi possível carregar seus dados de perfil.', 'error');
                navigate('/meu-perfil');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'documento') setForm(f => ({ ...f, [name]: maskCpf(value) }));
        else if (name === 'telefone') setForm(f => ({ ...f, [name]: maskTelefone(value) }));
        else setForm(f => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Salvando...');
        try {
            const payload = {
                nome: form.nome,
                telefone: (form.telefone || '').replace(/\D/g, ''),
                documento: (form.documento || '').replace(/\D/g, '')
            };
            await api.post('/perfil/cliente', payload);
            ui.showPostIt('Perfil atualizado com sucesso.', 'success');
            navigate('/meu-perfil');
        } catch (err) {
            console.error(err);
            ui.showPostIt(err.response?.data?.error || 'Erro ao salvar perfil.', 'error');
            setMessage('');
        }
    };

    if (loading) return <h2 style={{ padding: 50 }}>Carregando dados...</h2>;

    return (
        <div style={{ maxWidth: 800, margin: '30px auto', padding: 20, background: '#fff', borderRadius: 8 }}>
            <h2>Editar Meu Perfil</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>Nome</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} required />

                <label>Email (não editável)</label>
                <input type="email" name="email" value={form.email} disabled />

                <label>CPF</label>
                <input type="text" name="documento" value={form.documento} onChange={handleChange} placeholder="000.000.000-00" />

                <label>Telefone</label>
                <input type="text" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />

                <div style={{ marginTop: 10 }}>
                    <button type="submit" style={{ padding: '10px 16px', background: '#023047', color: '#fff', border: 'none', borderRadius: 6 }}>Salvar</button>
                    <button type="button" onClick={() => navigate('/meu-perfil')} style={{ marginLeft: 10, padding: '10px 16px' }}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default EditarPerfilCliente;
