import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CadastroPerfil from './CadastroPerfil';
import EditarPerfilCliente from './EditarPerfilCliente';

const PerfilEditar = () => {
    const { user } = useAuth();

    if (!user) return null;

    if (user.userType === 'barbeiro') {
        return <CadastroPerfil />; // reuse existing barber profile editor
    }

    // cliente
    return <EditarPerfilCliente />;
};

export default PerfilEditar;
