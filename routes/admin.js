const express = require('express');
const router = express.Router();
const db = require('../db');
const CharityController = require('../controllers/CharityController');

// Middleware de autenticação
function authMiddleware(role) {
    return function (req, res, next) {
        if (!req.session.user || req.session.user.role !== role) {
            return res.redirect('/login');
        }
        next();
    };
}

// Dashboard do admin
router.get('/dashboard', authMiddleware('admin'), (req, res) => {
    res.render('admin_dashboard');
});

// Rota para exibir o formulário de cadastro de instituição de caridade
router.get('/charity-form', authMiddleware('admin'), (req, res) => {
    res.render('charity_form');
});

// Rota para listar as instituições de caridade
router.get('/charities', authMiddleware('admin'), (req, res) => {
    const query = 'SELECT * FROM charity_institutions';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar instituições:', err);
            return res.status(500).send('Erro ao buscar instituições.');
        }
        res.render('charities_list', { charities: results });
    });
});

// Rota para deletar instituição de caridade
router.post('/charities/:id/delete', authMiddleware('admin'), (req, res) => {
    const charityId = req.params.id;

    const query = 'DELETE FROM charity_institutions WHERE id = ?';
    db.query(query, [charityId], (err) => {
        if (err) return res.status(500).send('Erro ao deletar instituição.');
        res.redirect('/admin/charities');
    });
});

// Rota para cadastro de instituições de caridade
router.post('/charities', authMiddleware('admin'), CharityController.create);

module.exports = router;
