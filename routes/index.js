const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Página principal
router.get('/', (req, res) => {
    res.render('index');
});

// Página de login
router.get('/login', (req, res) => {
    res.render('login');
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
