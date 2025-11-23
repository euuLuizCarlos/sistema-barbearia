import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StandardShell from './StandardShell';

export default function StandardLayout() {
  const location = useLocation();
  const path = location.pathname;

  // Rotas que NÃO devem ser envolvidas pelo shell (mantemos seus próprios layouts)
  const excluded = new Set([
    '/login',
    '/register',
    '/escolha-perfil',
    '/ativacao',
    '/perfil/cadastro',
    '/perfil/editar',
    '/forgot-password',
    '/reset-password',
    '/transacoes',
    '/relatorio',
    '/relatorio/',
    '/relatorios'
  ]);

  // Se a rota começar com alguma das exceções (por exemplo rota com param), lidamos com startsWith
  const isExcluded = Array.from(excluded).some(ex => path === ex || path.startsWith(ex + '/'));

  if (isExcluded) {
    return <Outlet />;
  }

  return (
    <StandardShell>
      <Outlet />
    </StandardShell>
  );
}
