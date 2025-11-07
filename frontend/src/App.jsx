// src/App.jsx - CÓDIGO FINAL E COMPLETO COM SEPARAÇÃO DE TELAS DE PERFIL

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { FaBars, FaSignOutAlt } from 'react-icons/fa'; 

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

// NOVOS COMPONENTES PARA SEPARAÇÃO DE TELA
import DetalhesPerfil from './pages/DetalhesPerfil'; 
import CadastroPerfil from './pages/CadastroPerfil'; 

// O componente MeuPerfil (antigo) será usado apenas para a rota /meu-perfil,
// mas ele será substituído pela rota DetalhesPerfil (abaixo).
// O componente original MeuPerfil já não existe mais neste arquivo, apenas o que sobrou
// da refatoração.

// ==========================================================
// Componentes Estruturais (Header, PrivateRoute)
// ==========================================================

const PrivateRoute = () => {
    const { isAuthenticated } = useAuth();
    // Redireciona para /login se não houver token
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const Header = ({ toggleSidebar }) => {
    const { isAuthenticated, logout, user } = useAuth();
    const location = useLocation();
    
    // Lista de rotas que não devem ter o Header
    const noNavRoutes = ['/login', '/register', '/escolha-perfil', '/ativacao', '/perfil/cadastro', '/perfil/editar'];
    const showHeader = isAuthenticated && !noNavRoutes.includes(location.pathname);

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


// BLOCO AppContent (Onde as rotas são definidas)
const AppContent = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const location = useLocation(); 
    
    const noNavRoutes = ['/login', '/register', '/escolha-perfil', '/ativacao', '/perfil/cadastro', '/perfil/editar'];
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
                        
                        {/* ROTAS SEM PROTEÇÃO DE PERFIL, MAS COM AUTENTICAÇÃO */}
                        
                        {/* 1. CADASTRO OBRIGATÓRIO (para Barbeiros sem perfil) */}
                        <Route path="/perfil/cadastro" element={<CadastroPerfil />} /> 
                        
                        {/* 2. EDIÇÃO DE PERFIL (acessada pelo botão 'Editar' na tela de Detalhes) */}
                        <Route path="/perfil/editar" element={<CadastroPerfil />} /> 
                        
                        
                        {/* ROTAS PRINCIPAIS PROTEGIDAS PELO PROFILE GUARD (SEGUNDO NÍVEL) */}
                        <Route element={<ProfileGuard />}> 
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/transacoes" element={<Transacoes key={location.key} />} />
                            <Route path="/relatorio" element={<Relatorios />} /> 
                            <Route path="/agenda" element={<Agenda />} />
                            <Route path="/configuracoes" element={<Configuracoes />} />
                            
                            {/* ROTA DE VISUALIZAÇÃO: AGORA SEPARADA E CHAMADA PELO DETALHESPERFIL */}
                            <Route path="/meu-perfil" element={<DetalhesPerfil />} />
                            
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