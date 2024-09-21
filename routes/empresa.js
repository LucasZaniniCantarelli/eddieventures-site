const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');

// Middleware de autenticação
function authMiddleware(role) {
    return function (req, res, next) {
        if (!req.session.user || req.session.user.role !== role) {
            return res.redirect('/login');
        }
        next();
    };
}


// Configuração de upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Dashboard da empresa
router.get('/dashboard', authMiddleware('empresa'), (req, res) => {
    res.render('empresa_dashboard', { empresa_id: req.session.user.empresa_id });
});


// Rota para visualizar anúncios comprados
router.get('/anuncios', authMiddleware('empresa'), (req, res) => {
    const empresa_id = req.session.user.empresa_id;

    const query = 'SELECT * FROM anuncios WHERE empresa_id = ?';
    db.query(query, [empresa_id], (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar anúncios.');
        res.render('anuncios_list', { anuncios: results });
    });
});

// Rota para visualizar relatórios
router.get('/relatorios', authMiddleware('empresa'), (req, res) => {
    const empresa_id = req.session.user.empresa_id;

    const query = 'SELECT * FROM anuncios WHERE empresa_id = ?';
    db.query(query, [empresa_id], (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar relatórios.');
        res.render('relatorios', { anuncios: results });
    });
});

// Rota para exibir o formulário de compra de anúncios
router.get('/purchase', authMiddleware('empresa'), (req, res) => {
    res.render('purchase_form');
});

// Rota para processar compra de anúncios
router.post('/purchase', upload.single('imagem'), authMiddleware('empresa'), (req, res) => {
    const empresa_id = req.session.user.empresa_id;  // Pegando o empresa_id da sessão
    const { quantidade, valor, cartao, validade, cvv } = req.body;
    const imagem_url = req.file ? req.file.filename : null;

    if (!quantidade || !valor || !cartao || !validade || !cvv || !imagem_url) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    const query = 'INSERT INTO anuncios (empresa_id, imagem_url, quantidade, valor) VALUES (?, ?, ?, ?)';
    db.query(query, [empresa_id, imagem_url, quantidade, valor], (err) => {
        if (err) return res.status(500).send('Erro ao registrar compra.');

        res.send(`
            <h1>Compra realizada com sucesso!</h1>
            <p>Você será redirecionado em breve...</p>
            <script>
                setTimeout(function() {
                    window.location.href = '/empresa/purchase';
                }, 3000);
            </script>
        `);
    });
});

module.exports = router;
