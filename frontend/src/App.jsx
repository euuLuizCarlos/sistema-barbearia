// src/App.jsx - CÓDIGO FINAL E COMPLETO COM CORREÇÃO DE IMPORTAÇÃO
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { FaDollarSign, FaCalendarAlt, FaHome, FaChartLine, FaCog } from 'react-icons/fa'; 

// IMPORTAÇÃO CORRIGIDA DO CONTEXTO DE AUTENTICAÇÃO
import { AuthProvider, useAuth } from './contexts/AuthContext'; 

// Importar Componentes de Estrutura
import NavBar from './components/NavBar';
import SplashScreen from './components/SplashScreen'; 
import EscolhaTipoUsuario from './components/Auth/EscolhaTipoUsuario'; 

// Importar as Páginas
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes'; 
import Relatorios from './pages/Relatorios';
import Agenda from './pages/Agenda'; 
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login'; 
import Register from './pages/Register'; 
import RegisterGuard from './pages/RegisterGuard'; 


// ==========================================================
// COMPONENTES DE ESTRUTURA
// ==========================================================

const PrivateRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const Navigation = () => {
    const location = useLocation(); 
    const { logout } = useAuth();
    
    const linkStyle = (path) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textDecoration: 'none',
        color: location.pathname.startsWith(path) ? 'blue' : 'gray', 
        fontSize: '12px',
        minWidth: '65px' 
    });
    
    const handleLogout = () => {
        logout(); 
    };

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, width: '100%', height: '60px',
            background: '#fff', borderTop: '1px solid #ccc', display: 'flex',
            justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 
        }}>
            <Link to="/" style={linkStyle('/')}> <FaHome size={20} /> Principal </Link>
            <Link to="/transacoes" style={linkStyle('/transacoes')}> <FaDollarSign size={20} /> Transações </Link>
            <Link to="/relatorio" style={linkStyle('/relatorio')}> <FaChartLine size={20} /> Relatórios </Link>
            <Link to="/agenda" style={linkStyle('/agenda')}> <FaCalendarAlt size={20} /> Agenda </Link>
            <Link to="/configuracoes" style={linkStyle('/configuracoes')}> <FaCog size={20} /> Config. </Link>
            <div onClick={handleLogout} style={{...linkStyle(''), color: 'red', cursor: 'pointer'}}>
                <FaCog size={20} />
                Sair
            </div>
        </div>
    );
};


const AppContent = () => {
    const location = useLocation(); 
    
    const noNavRoutes = ['/login', '/register', '/escolha-perfil'];
    const showNavigation = !noNavRoutes.includes(location.pathname);

    return (
        <div style={{ paddingBottom: showNavigation ? '60px' : '0' }}> 
            <Routes>
                
                {/* ROTAS DE AUTENTICAÇÃO (Sem navbar) */}
                <Route path="/login" element={<Login />} />
                <Route path="/escolha-perfil" element={<EscolhaTipoUsuario />} />
                
                {/* ROTA DE REGISTRO - Chama o Guarda que faz a escolha */}
                <Route path="/register" element={<RegisterGuard />} /> 
                
                {/* ROTA PROTEGIDA: Envolve todas as rotas principais */}
                <Route element={<PrivateRoute />}>
                    {/* ROTAS PRINCIPAIS DO SISTEMA (Protegidas) */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transacoes" element={<Transacoes key={location.key} />} />
                    <Route path="/relatorio" element={<Relatorios />} /> 
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/transacoes/:id" element={<h2>Detalhe de Transação</h2>} />
                </Route>
            </Routes>
            
            {showNavigation && <Navigation />}
        </div>
    );
};


function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000); 

        return () => clearTimeout(timer); 
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                {showSplash ? (
                    <SplashScreen />
                ) : (
                    <AppContent />
                )}
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;