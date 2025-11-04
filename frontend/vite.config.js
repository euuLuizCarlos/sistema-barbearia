import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // SOLUÇÃO PARA O ERRO DE PÁGINA PRETA/404 NO REFRESH
  server: {
    // Adiciona o fallback para o index.html, corrigindo o erro de página em branco
    historyApiFallback: true,
  },
  
  // Garante que o caminho base da aplicação seja a raiz
  base: '/',
})