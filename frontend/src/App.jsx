// src/App.jsx - CÓDIGO FINAL E COMPLETO
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { FaDollarSign, FaCalendarAlt, FaHome, FaChartLine, FaCog, FaBars, FaSignOutAlt, FaUserAlt } from 'react-icons/fa'; 

// Importar Componentes de Proteção e Lógica
import { AuthProvider, useAuth } from './contexts/AuthContext'; 
import Sidebar from './components/Sidebar'; 
import SplashScreen from './components/SplashScreen'; 
import EscolhaTipoUsuario from './components/Auth/EscolhaTipoUsuario'; 
import ProfileGuard from './components/Guards/ProfileGuard'; 

// Importar as Páginas
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes'; 
import Relatorios from './pages/Relatorios';
import Agenda from './pages/Agenda'; 
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login'; 
import Register from './pages/Register'; 
import AtivacaoConta from './pages/AtivacaoConta';
import CadastroPerfilBarbeiro from './pages/CadastroPerfilBarbeiro';
import MeuPerfil from './pages/MeuPerfil'; // Nova rota de Perfil


// ==========================================================
// COMPONENTES DE ESTRUTURA E GUARDA DE ROTAS
// ==========================================================

const PrivateRoute = () => {
    const { isAuthenticated } = useAuth();
    // Redireciona para /login se não houver token
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};


// Header (Menu Hambúrguer, Título, Botão Sair)
const Header = ({ toggleSidebar }) => {
    const { isAuthenticated, logout, user } = useAuth();
    const location = useLocation();
    
    const showHeader = isAuthenticated && !['/login', '/register', '/escolha-perfil', '/ativacao', '/perfil/cadastro'].includes(location.pathname);

    if (!showHeader) return null;
    
    const userName = user?.userName || 'Barbeiro(a)';

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #ccc',
            position: 'sticky', top: 0, zIndex: 10
        }}>
            <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#023047' }}>
                <FaBars />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2em', color: '#023047' }}>Bem-vindo, {userName.split(' ')[0]}!</h2>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaSignOutAlt /> Sair
            </button>
        </div>
    );
};


// src/App.jsx - APENAS O BLOCO AppContent (ROTAS CORRIGIDAS)

const AppContent = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const location = useLocation(); 
    
    const noNavRoutes = ['/login', '/register', '/escolha-perfil', '/ativacao', '/perfil/cadastro'];
    const showHeader = !noNavRoutes.includes(location.pathname);

    return (
        <>
            {showHeader && <Header toggleSidebar={toggleSidebar} />}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div style={{ marginLeft: sidebarOpen ? '250px' : '0', transition: 'margin-left 0.3s' }}>
                <Routes>
                    
                    {/* ROTAS PÚBLICAS */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/escolha-perfil" element={<EscolhaTipoUsuario />} />
                    <Route path="/ativacao" element={<AtivacaoConta />} /> 
                    <Route path="/register" element={<Register />} /> 
                    
                    {/* ROTAS PROTEGIDAS PELO LOGIN (PRIMEIRO NÍVEL) */}
                    <Route element={<PrivateRoute />}>
                        
                        {/* ROTA EXCLUSIVA DE CADASTRO DE PERFIL (Para o ProfileGuard redirecionar) */}
                        <Route path="/perfil/cadastro" element={<CadastroPerfilBarbeiro />} /> 

                        {/* ROTAS PRINCIPAIS PROTEGIDAS PELO PROFILE GUARD (SEGUNDO NÍVEL) */}
                        <Route element={<ProfileGuard />}> 
                            {/* TODAS AS FERRAMENTAS DO BARBEIRO VÃO AQUI */}
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/transacoes" element={<Transacoes key={location.key} />} />
                            <Route path="/relatorio" element={<Relatorios />} /> 
                            <Route path="/agenda" element={<Agenda />} />
                            <Route path="/configuracoes" element={<Configuracoes />} />
                            <Route path="/meu-perfil" element={<MeuPerfil />} />
                            <Route path="/transacoes/:id" element={<h2>Detalhe de Transação</h2>} />
                        </Route>
                    </Route>
                    
                    {/* Fallback de segurança */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </>
    );
};


function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 1000); 

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