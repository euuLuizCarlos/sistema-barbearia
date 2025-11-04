// src/controllers/TaxaCartaoController.js

const connection = require('../database/connection'); // Ajuste o caminho se for diferente

module.exports = {
    // FUNÇÃO 1: Busca a taxa atual
    async getTaxa(request, response) {
        try {
            // Buscamos a taxa com ID 1, que é o nosso registro único de configuração
            const [taxa] = await connection('taxa_cartao').select('taxa').where('id', 1);
            
            if (taxa) {
                // Retorna a taxa como um número de porcentagem (ex: 2.50)
                return response.json({ taxa: parseFloat(taxa.taxa) });
            }
            // Fallback caso não encontre (deve sempre retornar 0.00, pois inserimos no SQL)
            return response.json({ taxa: 0.00 }); 
        } catch (error) {
            console.error("Erro ao buscar taxa de cartão:", error);
            return response.status(500).json({ error: "Erro interno ao buscar taxa." });
        }
    },

    // FUNÇÃO 2: Atualiza a taxa
    async updateTaxa(request, response) {
        const { taxa } = request.body; // Esperamos a taxa como um número (ex: 2.5)

        // Validação
        if (typeof taxa === 'undefined' || taxa === null || isNaN(taxa) || parseFloat(taxa) < 0) {
            return response.status(400).json({ error: "Taxa inválida. Use um número positivo." });
        }

        const taxaNumerica = parseFloat(taxa);

        try {
            // Atualiza a única linha com ID 1
            const count = await connection('taxa_cartao')
                .where('id', 1)
                .update({ taxa: taxaNumerica });
            
            if (count === 0) {
                // Se não atualizou, pode ser que a linha 1 não exista (o que não deveria ocorrer)
                // Inserimos ela novamente para garantir
                await connection('taxa_cartao').insert({ id: 1, taxa: taxaNumerica });
            }

            return response.status(200).json({ message: "Taxa de cartão atualizada com sucesso!" });
            
        } catch (error) {
            console.error("Erro ao atualizar taxa de cartão:", error);
            return response.status(500).json({ error: "Erro interno ao atualizar taxa." });
        }
    }
};