const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Rota GET para exibir o formulário de registro
router.get('/register', (req, res) => {
    res.render('register');  // Certifique-se de que 'register.ejs' está na pasta correta
});

// Rota POST para processar o registro de novas empresas
router.post('/register', async (req, res) => {
    let { name, cnpj, email, password } = req.body;

    // Remover formatação do CNPJ (pontos, barras, hífens)
    cnpj = cnpj.replace(/[^\d]/g, '');  // Isso transforma "00.000.000/0000-00" em "00000000000000"
    console.log('CNPJ sem formatação:', cnpj);

    // Verificar se o CNPJ já existe
    const queryEmpresa = 'SELECT * FROM companies WHERE cnpj = ?';
    db.query(queryEmpresa, [cnpj], (err, results) => {
        if (err) {
            console.error('Erro ao verificar CNPJ:', err);
            return res.status(500).send('Erro ao verificar CNPJ.');
        }

        if (results.length > 0) {
            console.log('CNPJ já cadastrado:', cnpj);
            return res.status(400).send('CNPJ já cadastrado.');
        }

        console.log('CNPJ não encontrado, cadastrando nova empresa.');

        // Inserir a empresa na tabela companies
        const queryInsertEmpresa = 'INSERT INTO companies (name, cnpj, email) VALUES (?, ?, ?)';
        db.query(queryInsertEmpresa, [name, cnpj, email], async (err, result) => {
            if (err) {
                console.error('Erro ao cadastrar empresa:', err);
                return res.status(500).send('Erro ao cadastrar empresa.');
            }

            const empresa_id = result.insertId;
            console.log('Empresa cadastrada com sucesso. ID da empresa:', empresa_id);

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Senha hashada:', hashedPassword);

            // Criar usuário para a empresa
            const queryInsertUser = 'INSERT INTO users (email, password, role, empresa_id) VALUES (?, ?, ?, ?)';
            db.query(queryInsertUser, [email, hashedPassword, 'empresa', empresa_id], (err) => {
                if (err) {
                    console.error('Erro ao cadastrar usuário:', err);
                    return res.status(500).send('Erro ao cadastrar usuário.');
                }
                console.log('Usuário cadastrado com sucesso.');
                res.redirect('/login');
            });
        });
    });
});

// Rota GET para exibir o formulário de login
router.get('/login', (req, res) => {
    res.render('login');
});

// Rota POST para processar o login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err || results.length === 0) {
            console.log('Usuário não encontrado ou erro de consulta');
            return res.status(400).send('Email ou senha incorretos.');
        }

        const user = results[0];

        // Comparar a senha digitada com a senha armazenada (hash)
        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                console.log('Senha incorreta');
                return res.status(400).send('Email ou senha incorretos.');
            }

            // Login bem-sucedido, armazenar o usuário na sessão
            req.session.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                empresa_id: user.empresa_id
            };

            // Redirecionar com base no papel (role)
            if (user.role === 'admin') {
                res.redirect('/admin/dashboard');  // Caminho correto para o dashboard do admin
            } else {
                res.redirect('/empresa/dashboard');  // Caminho correto para o dashboard da empresa
            }
        });
    });
});

// Rota para logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
