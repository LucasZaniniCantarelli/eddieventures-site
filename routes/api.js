const express = require('express');
const router = express.Router();
const db = require('../db'); // Certifique-se de que o db.js esteja configurado corretamente

// Middleware para verificar a chave de API
router.use((req, res, next) => {
    const apiKey = req.headers['x-api-key']; // Cabeçalho da chave de API
    const validApiKey = '123456'; // Substitua pela sua chave de API real

    if (apiKey === validApiKey) {
        next();
    } else {
        return res.status(403).json({ error: 'Chave de API inválida.' });
    }
});

// Rota para listar os anúncios disponíveis
router.get('/ads', (req, res) => {
    const query = 'SELECT * FROM anuncios WHERE quantidade > 0'; // Só mostrar anúncios com estoque
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar anúncios.' });
        }
        res.json(results); // Retorna os anúncios em formato JSON
    });
});

// Rota para atualizar o estoque de um anúncio
router.post('/ads/collect', (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID do anúncio é obrigatório.' });
    }

    const query = 'UPDATE anuncios SET quantidade = quantidade - 1 WHERE id = ? AND quantidade > 0';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar estoque.' });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Anúncio não encontrado ou sem estoque.' });
        }

        res.json({ message: 'Estoque atualizado com sucesso!' });
    });
});

module.exports = router;
