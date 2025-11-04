// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Cadastrando...');
        
        try {
            const response = await api.post('/auth/register', { 
                nome: formData.nome,
                email: formData.email,
                password: formData.password
            });

            setMessage(response.data.message + ' Redirecionando para o Login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Erro no cadastro. Verifique a conexão.';
            setMessage(errorMessage);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Cadastro de Barbeiro</h2>
            <form onSubmit={handleSubmit}>
                <label>Nome:</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
                <br /><br />
                <label>Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                <br /><br />
                <label>Senha:</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                <br /><br />
                <button type="submit">Cadastrar</button>
            </form>
            {message && <p style={{ marginTop: '15px', color: message.includes('sucesso') ? 'green' : 'red' }}>{message}</p>}
            <p style={{ marginTop: '20px' }}><a href="/login">Já tem conta? Faça Login</a></p>
        </div>
    );
};

export default Register;