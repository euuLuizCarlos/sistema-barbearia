// src/components/NavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDollarSign, FaCalendarAlt, FaHome, FaChartLine, FaCog, FaSignOutAlt } from 'react-icons/fa'; 
import { useAuth } from '../contexts/AuthContext'; // Importamos o hook de autenticação

const NavBar = () => {
    const location = useLocation();
    const { logout } = useAuth();
    
    // Estilo base do link (copiado da lógica de navegação do AppContent)
    const linkStyle = (path) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textDecoration: 'none',
        color: location.pathname.startsWith(path) ? 'blue' : 'gray',
        fontSize: '12px',
        minWidth: '65px',
    });

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            background: '#fff',
            borderTop: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000 
        }}>
            {/* Links de Navegação */}
            <Link to="/" style={linkStyle('/')}>
                <FaHome size={20} />
                Principal
            </Link>
            <Link to="/transacoes" style={linkStyle('/transacoes')}>
                <FaDollarSign size={20} />
                Transações
            </Link>
            <Link to="/relatorio" style={linkStyle('/relatorio')}> 
                <FaChartLine size={20} />
                Relatórios
            </Link>
            <Link to="/agenda" style={linkStyle('/agenda')}>
                <FaCalendarAlt size={20} />
                Agenda
            </Link>
            <Link to="/configuracoes" style={linkStyle('/configuracoes')}>
                <FaCog size={20} />
                Config.
            </Link>
            
            {/* Botão de Logout */}
            <div onClick={logout} style={{...linkStyle(''), color: 'red', cursor: 'pointer'}}>
                <FaSignOutAlt size={20} />
                Sair
            </div>
        </div>
    );
};

export default NavBar;