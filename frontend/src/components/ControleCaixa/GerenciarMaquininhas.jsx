// src/components/ControleCaixa/GerenciarMaquininhas.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useUi } from '../../contexts/UiContext';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaCreditCard } from 'react-icons/fa';

const COLORS = {
    PRIMARY: '#023047',
    ACCENT: '#FFB703',
    SUCCESS: '#4CAF50',
    ERROR: '#cc0000',
    BACKGROUND_LIGHT: '#f5f5f5'
};

const GerenciarMaquininhas = () => {
    const ui = useUi();
    const [maquininhas, setMaquininhas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null); // ID da maquininha aguardando confirmação de exclusão
    
    // Estado para adicionar/editar
    const [editMode, setEditMode] = useState(null); // ID da maquininha em edição, ou 'new'
    const [formData, setFormData] = useState({ nome: '', taxa: '', ativa: true });

    useEffect(() => {
        fetchMaquininhas();
    }, []);

    const fetchMaquininhas = async () => {
        try {
            const response = await api.get('/maquininhas');
            setMaquininhas(response.data);
        } catch (error) {
            ui.showPostIt('Erro ao carregar maquininhas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditMode('new');
        setFormData({ nome: '', taxa: '', ativa: true });
    };

    const handleEdit = (maquininha) => {
        setEditMode(maquininha.id);
        setFormData({ 
            nome: maquininha.nome, 
            taxa: maquininha.taxa, 
            ativa: maquininha.ativa 
        });
    };

    const handleCancel = () => {
        setEditMode(null);
        setFormData({ nome: '', taxa: '', ativa: true });
    };

    const handleSave = async () => {
        if (!formData.nome || !formData.taxa) {
            ui.showPostIt('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const taxaNumerica = parseFloat(formData.taxa);
        if (isNaN(taxaNumerica) || taxaNumerica < 0 || taxaNumerica > 100) {
            ui.showPostIt('Taxa deve estar entre 0 e 100.', 'error');
            return;
        }

        try {
            if (editMode === 'new') {
                await api.post('/maquininhas', formData);
                ui.showPostIt('Maquininha criada com sucesso!', 'success');
            } else {
                await api.put(`/maquininhas/${editMode}`, formData);
                ui.showPostIt('Maquininha atualizada com sucesso!', 'success');
            }
            handleCancel();
            fetchMaquininhas();
        } catch (error) {
            ui.showPostIt(error.response?.data?.error || 'Erro ao salvar maquininha.', 'error');
        }
    };

    const handleDelete = async (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async (id) => {
        try {
            await api.delete(`/maquininhas/${id}`);
            ui.showPostIt('Maquininha excluída com sucesso!', 'success');
            setDeleteConfirmId(null);
            fetchMaquininhas();
        } catch (error) {
            ui.showPostIt(error.response?.data?.error || 'Erro ao excluir maquininha.', 'error');
            setDeleteConfirmId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmId(null);
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: `3px solid ${COLORS.ACCENT}`,
                paddingBottom: '10px'
            }}>
                <h2 style={{ margin: 0, color: COLORS.PRIMARY }}>
                    <FaCreditCard style={{ marginRight: '10px' }} />
                    Gerenciar Maquininhas
                </h2>
                {editMode === null && (
                    <button
                        onClick={handleAdd}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: COLORS.SUCCESS,
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        <FaPlus style={{ marginRight: '5px' }} />
                        Nova Maquininha
                    </button>
                )}
            </div>

            {/* Formulário de Adição/Edição */}
            {editMode !== null && (
                <div style={{
                    backgroundColor: COLORS.BACKGROUND_LIGHT,
                    padding: '20px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: `2px solid ${COLORS.ACCENT}`
                }}>
                    <h3 style={{ marginTop: 0, color: COLORS.PRIMARY }}>
                        {editMode === 'new' ? 'Nova Maquininha' : 'Editar Maquininha'}
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Nome da Maquininha *
                        </label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Máquina PagSeguro, Máquina SumUp..."
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Taxa (%) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.taxa}
                            onChange={(e) => setFormData({ ...formData, taxa: e.target.value })}
                            placeholder="Ex: 2.00"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.ativa}
                                onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                                style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: 'bold' }}>Maquininha Ativa</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: COLORS.SUCCESS,
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaSave style={{ marginRight: '5px' }} />
                            Salvar
                        </button>
                        <button
                            onClick={handleCancel}
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#999',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaTimes style={{ marginRight: '5px' }} />
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de Maquininhas */}
            {maquininhas.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    backgroundColor: COLORS.BACKGROUND_LIGHT,
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '1.1em', color: '#666' }}>
                        Nenhuma maquininha cadastrada ainda.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {maquininhas.map((maq) => (
                        <div
                            key={maq.id}
                            style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '10px',
                                border: `2px solid ${maq.ativa ? COLORS.PRIMARY : '#ccc'}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: maq.ativa ? 1 : 0.6
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 8px 0', color: COLORS.PRIMARY }}>
                                    {maq.nome}
                                    {!maq.ativa && (
                                        <span style={{ 
                                            marginLeft: '10px', 
                                            fontSize: '0.8em', 
                                            color: '#999',
                                            fontWeight: 'normal'
                                        }}>
                                            (Inativa)
                                        </span>
                                    )}
                                </h3>
                                <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                                    <strong>Taxa:</strong> {parseFloat(maq.taxa).toFixed(2)}%
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleEdit(maq)}
                                    disabled={editMode !== null}
                                    style={{
                                        padding: '10px 15px',
                                        backgroundColor: editMode !== null ? '#ccc' : COLORS.ACCENT,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: editMode !== null ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDelete(maq.id)}
                                    disabled={editMode !== null}
                                    style={{
                                        padding: '10px 15px',
                                        backgroundColor: editMode !== null ? '#ccc' : COLORS.ERROR,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: editMode !== null ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {deleteConfirmId !== null && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: COLORS.ERROR }}>
                            Excluir Maquininha?
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#666', fontSize: '0.95em' }}>
                            Tem certeza que deseja excluir esta maquininha? Esta ação não pode ser desfeita.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => confirmDelete(deleteConfirmId)}
                                style={{
                                    padding: '10px 25px',
                                    backgroundColor: COLORS.ERROR,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Sim, Excluir
                            </button>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: '10px 25px',
                                    backgroundColor: '#999',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GerenciarMaquininhas;
