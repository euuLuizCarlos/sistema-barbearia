// src/helpers/dateFormatting.js
// Helper para formatação de datas em português

// Nomes dos meses em português
export const MESES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MESES_PT_ABREV = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

// Nomes dos dias da semana em português
export const DIAS_SEMANA_PT = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export const DIAS_SEMANA_PT_ABREV = [
    'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'
];

// Formata data para DD/MMM/YYYY em português
export const formatarDataPT = (data) => {
    if (!data) return '';
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = MESES_PT_ABREV[d.getMonth()];
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
};

// Formata data para DD de MMMM de YYYY em português
export const formatarDataPTCompleta = (data) => {
    if (!data) return '';
    const d = new Date(data);
    const dia = d.getDate();
    const mes = MESES_PT[d.getMonth()];
    const ano = d.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
};

// Retorna o nome do dia da semana em português
export const getDiaSemanaPT = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return DIAS_SEMANA_PT[d.getDay()];
};

// Retorna o nome abreviado do dia da semana em português
export const getDiaSemanaAbrevPT = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return DIAS_SEMANA_PT_ABREV[d.getDay()];
};

// Formata data em formato brasileiro (DD/MM/YYYY)
export const formatarDataBR = (data) => {
    if (!data) return '';
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
};

// Converte data com hora para formato brasileiro com hora
export const formatarDataHoraBR = (dataHora) => {
    if (!dataHora) return '';
    const d = new Date(dataHora);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
};
