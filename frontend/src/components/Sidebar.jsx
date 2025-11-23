import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Importa todos os ícones necessários
import { FaHome, FaDollarSign, FaChartLine, FaCalendarAlt, FaCog, FaSignOutAlt, FaUserAlt, FaClipboardList, FaClock, FaAlignJustify, FaSearch } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout, user } = useAuth();
    const location = useLocation();
    
    const isClient = user?.userType === 'cliente';
    const userProfilePath = '/meu-perfil'; 

    // --- DEFINIÇÕES DOS ITENS DE NAVEGAÇÃO ---
    // 1. O item 'Início' é a base para todos (Cliente e Barbeiro)
    const baseItems = [
        { path: '/', name: 'Painel', icon: FaHome, isBottom: false }, // CHAVE ÚNICA AQUI
    ];

    // 2. Itens Exclusivos de Gestão (Barbeiro/Admin)
    const barberItems = [
        { path: '/transacoes', name: 'Transações', icon: FaDollarSign, isBottom: false },
        { path: '/servicos', name: 'Meus Serviços', icon: FaClipboardList, isBottom: false },
        { path: '/horarios', name: 'Meus Horários', icon: FaClock, isBottom: false },
        { path: '/relatorio', name: 'Relatórios', icon: FaChartLine, isBottom: false },
        { path: '/agenda', name: 'Agenda (Barbeiro)', icon: FaCalendarAlt, isBottom: false },
        { path: '/configuracoes', name: 'Configurações', icon: FaCog, isBottom: false },
    ];
    
    // 3. Itens Exclusivos/Específicos do Cliente
    const clientItems = [
        // Usamos o Perfil como o 'Menu' geral para o Cliente

        { path: '/meus-agendamentos', name: 'Meus Agendamentos', icon: FaCalendarAlt, isBottom: false },
    ];
    
    // 4. Monta a lista final e o item de rodapé
    let menuItems = [...baseItems];
    let bottomLink = null;

    if (isClient) {
        menuItems = [...menuItems, ...clientItems];
        
        // 💡 MOVENDO O PERFIL DO CLIENTE PARA O RODAPÉ 💡
        bottomLink = { path: userProfilePath, name: 'Meu Perfil', icon: FaUserAlt }; 
    } else {
        menuItems = [...menuItems, ...barberItems];
        
        // O Barbeiro também tem o link de Perfil separado no rodapé
        bottomLink = { path: userProfilePath, name: 'Meu Perfil', icon: FaUserAlt };
    }
    
    const topLinks = menuItems; // Todos os links são considerados "top" agora
    
    // --- ESTILOS (Mantidos) ---
    const style = {
        sidebar: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '250px',
            height: '100%',
            backgroundColor: '#023047', 
            color: '#fff',
            paddingTop: '60px', 
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
            backgroundColor: '#FFB703', 
            color: '#023047',
            fontWeight: 'bold',
        },
        bottomSection: {
            padding: '20px 0',
            borderTop: bottomLink ? '1px solid #333' : 'none', 
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

    return (
        <div style={style.sidebar}>
            {/* Seção Superior do Menu */}
            <div>
                {topLinks.map((item) => (
                    <Link
                        key={item.path} // Agora a chave é única: '/' só aparece uma vez
                        to={item.path}
                        onClick={toggleSidebar}
                        style={{
                            ...style.link,
                            ...(location.pathname.startsWith(item.path) && item.path !== '/' && location.pathname !== userProfilePath ? style.linkActive : {}),
                            ...(location.pathname === item.path && (item.path === '/' || item.path === userProfilePath) ? style.linkActive : {}),
                        }}
                    >
                        <item.icon size={20} style={{ marginRight: '10px' }} />
                        {item.name}
                    </Link>
                ))}
            </div>

            {/* Seção Inferior do Menu (Para o link de Perfil do Barbeiro e o botão Sair) */}
            <div style={style.bottomSection}>
                {bottomLink && (
                    <Link
                        key={bottomLink.path}
                        to={bottomLink.path}
                        onClick={toggleSidebar}
                        style={{ ...style.link, ...(location.pathname === bottomLink.path ? style.linkActive : {}) }}
                    >
                        <bottomLink.icon size={20} style={{ marginRight: '10px' }} />
                        {bottomLink.name}
                    </Link>
                )}
                
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