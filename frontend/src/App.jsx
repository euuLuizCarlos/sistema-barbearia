// src/App.jsx
import React from 'react';
import ListaMovimentacoes from './components/ControleCaixa/ListaMovimentacoes';

function App() {
  return (
    <div className="App">
      {/* Aqui chamamos o componente que lista os dados do backend */}
      <ListaMovimentacoes />
    </div>
  );
}

export default App;