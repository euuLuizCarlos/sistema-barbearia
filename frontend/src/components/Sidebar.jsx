import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Importado FaClock para Horários
import { FaHome, FaDollarSign, FaChartLine, FaCalendarAlt, FaCog, FaSignOutAlt, FaUserAlt, FaClipboardList, FaClock } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();
    const location = useLocation();

    // Lista de itens do menu.
    const menuItems = [
        { path: '/', name: 'Principal', icon: FaHome, isBottom: false },
        { path: '/transacoes', name: 'Transações', icon: FaDollarSign, isBottom: false },
        
        // --- ITENS DE GERENCIAMENTO ---
        { path: '/servicos', name: 'Meus Serviços', icon: FaClipboardList, isBottom: false },
        { path: '/horarios', name: 'Meus Horários', icon: FaClock, isBottom: false }, // <--- NOVO ITEM ADICIONADO
        
        { path: '/relatorio', name: 'Relatórios', icon: FaChartLine, isBottom: false },
        { path: '/agenda', name: 'Agenda', icon: FaCalendarAlt, isBottom: false },
        { path: '/configuracoes', name: 'Configurações', icon: FaCog, isBottom: false },
        { path: '/meu-perfil', name: 'Meu Perfil', icon: FaUserAlt, isBottom: true }, 
    ];

    const style = {
        sidebar: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '250px',
            height: '100%',
            backgroundColor: '#023047', // Cor primária do Dark Mode
            color: '#fff',
            paddingTop: '60px', // Espaço para o Header
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            zIndex: 20,
            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between', 
        },
        link: {
            display: 'flex',
            alignItems: 'center',
            padding: '15px 20px',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '1em',
            transition: 'background-color 0.2s',
        },
        linkActive: {
            backgroundColor: '#FFB703', // Cor de destaque
            color: '#023047',
            fontWeight: 'bold',
        },
        bottomSection: {
            padding: '20px 0',
            borderTop: '1px solid #333',
        },
        logoutButton: {
            display: 'flex',
            alignItems: 'center',
            padding: '15px 20px',
            color: '#f00',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            backgroundColor: '#023047',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            fontSize: '1em',
            fontWeight: 'bold',
        },
    };

    // Filtra os links superiores e inferiores
    const topLinks = menuItems.filter(item => !item.isBottom);
    const bottomLinks = menuItems.filter(item => item.isBottom);

    return (
        <div style={style.sidebar}>
            {/* Seção Superior do Menu */}
            <div>
                {topLinks.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={toggleSidebar}
                        style={{
                            ...style.link,
                            ...(location.pathname === item.path ? style.linkActive : {}),
                        }}
                    >
                        <item.icon size={20} style={{ marginRight: '10px' }} />
                        {item.name}
                    </Link>
                ))}
            </div>

            {/* Seção Inferior do Menu */}
            <div style={style.bottomSection}>
                {/* Meu Perfil (abaixo das outras rotas) */}
                {bottomLinks.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={toggleSidebar}
                        style={{
                            ...style.link,
                            ...(location.pathname === item.path ? style.linkActive : {}),
                        }}
                    >
                        <item.icon size={20} style={{ marginRight: '10px' }} />
                        {item.name}
                    </Link>
                ))}
                
                {/* Botão Sair (O Último elemento) */}
                <button
                    onClick={() => {
                        logout();
                        toggleSidebar();
                    }}
                    style={style.logoutButton}
                >
                    <FaSignOutAlt size={20} style={{ marginRight: '10px' }} />
                    Sair
                </button>
            </div>
        </div>
    );
};

export default Sidebar;