const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db'); //banco de dados
const fs = require('fs')


const CharityController = require('./controllers/CharityController');
const CompanyController = require('./controllers/CompanyController');

const app = express();
const port = 3000;

// Configurar EJS como motor de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração da sessão
app.use(session({
    secret: 'chave_secreta',
    resave: false,
    saveUninitialized: true
}));

// Função middleware para proteger rotas
function authMiddleware(role) {
    return function (req, res, next) {
        if (!req.session.user || req.session.user.role !== role) {
            return res.redirect('/login');
        }
        next();
    };
}

app.use((req, res, next) => {
    res.locals.user = req.session.user;  // Armazena o usuário na resposta local
    next();
});


// Página de login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Mostrar o email e a senha que foram enviados no console
    console.log(`Email digitado: ${email}`);
    console.log(`Senha digitada: ${password}`);

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

            console.log('Usuário logado:', req.session.user);

            if (user.role === 'admin') {
                res.redirect('/admin-dashboard');
            } else {
                res.redirect('/empresa-dashboard');
            }
        });
    });
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Dashboard do admin
app.get('/admin-dashboard', authMiddleware('admin'), (req, res) => {
    res.render('admin_dashboard');
});

// Dashboard da empresa
app.get('/empresa-dashboard', authMiddleware('empresa'), (req, res) => {
    res.render('empresa_dashboard', { empresa_id: req.session.user.empresa_id });
});

// Rota para visualizar os anúncios comprados pela empresa logada
app.get('/anuncios', (req, res) => {
    const empresa_id = req.session.user.empresa_id;

    if (!empresa_id) {
        return res.status(403).send('Acesso negado. Usuário não autenticado.');
    }

    const query = 'SELECT * FROM anuncios WHERE empresa_id = ?';
    db.query(query, [empresa_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar anúncios:', err);
            return res.status(500).send('Erro ao buscar anúncios.');
        }

        res.render('anuncios_list', { anuncios: results });
    });
});

// Rota para visualizar relatórios de anúncios da empresa logada
app.get('/relatorios', (req, res) => {
    const empresa_id = req.session.user.empresa_id;

    if (!empresa_id) {
        return res.status(403).send('Acesso negado. Usuário não autenticado.');
    }

    const query = 'SELECT * FROM anuncios WHERE empresa_id = ?';
    db.query(query, [empresa_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar anúncios para relatórios:', err);
            return res.status(500).send('Erro ao buscar relatórios.');
        }

        // Envia os anúncios para a view relatorios.ejs
        res.render('relatorios', { anuncios: results });
    });
});

// Rota GET para exibir o formulário de registro de empresas
app.get('/register', (req, res) => {
    res.render('register');
});

// Rota para cadastrar empresas e criar usuário:
app.post('/register', async (req, res) => {
    let { name, cnpj, email, password } = req.body;

    // Remover formatação do CNPJ (pontos, barras, hífens) e deixar apenas números
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



// Configuração do armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Nome único para cada imagem
    }
});

const upload = multer({ storage });

// Página principal
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para a página de compra de anúncios
app.get('/purchase-form', (req, res) => {
    res.render('purchase_form');
});

// Formulários de cadastro
app.get('/charity-form', authMiddleware('admin'), (req, res) => {
    res.render('charity_form');
});


app.get('/company-form', (req, res) => {
    res.render('company_form');
});

// Rota para listar instituições de caridade
app.get('/charities', (req, res) => {
    const query = 'SELECT * FROM charity_institutions';
    db.query(query, (err, charities) => {
        if (err) {
            console.error('Erro ao buscar instituições de caridade:', err);
            return res.status(500).send('Erro ao buscar instituições de caridade.');
        }
        res.render('charities_list', { charities });
    });
});

// Rotas de criação
app.post('/charities', CharityController.create);
app.post('/companies', CompanyController.create);

// Rota para deletar uma instituição de caridade
app.post('/charities/:id/delete', (req, res) => {
    const charityId = req.params.id;

    const query = 'DELETE FROM charity_institutions WHERE id = ?';
    db.query(query, [charityId], (err, result) => {
        if (err) {
            console.error('Erro ao deletar instituição de caridade:', err);
            return res.status(500).send('Erro ao deletar instituição de caridade.');
        }
        res.redirect('/charities');  // Redireciona para a lista de instituições após a deleção
    });
});

// Rota para processar a compra de anúncios
app.post('/purchase', upload.single('imagem'), (req, res) => {
    const { empresa_id, quantidade, valor, cartao, validade, cvv } = req.body;
    const imagem_url = req.file ? req.file.filename : null;

    if (!empresa_id || !quantidade || !valor || !cartao || !validade || !cvv || !imagem_url) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    // Inserir dados no banco de dados
    const query = 'INSERT INTO anuncios (empresa_id, imagem_url, quantidade, valor) VALUES (?, ?, ?, ?)';
    db.query(query, [empresa_id, imagem_url, quantidade, valor], (err, result) => {
        if (err) {
            console.error('Erro ao registrar compra:', err);
            return res.status(500).send('Erro ao registrar compra.');
        }

    // Envia uma mensagem e redireciona após um delay de 3 segundos
    res.send(`
        <h1>Compra realizada com sucesso! Anúncio armazenado.</h1>
        <p>Você será redirecionado em breve...</p>
        <script>
            setTimeout(function() {
                window.location.href = '/purchase-form';
            }, 3000);  // Redireciona após 3 segundos
        </script>
    `);

    });
});

// Servir arquivos estáticos (como imagens)
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em: http://localhost:${port}`);
});
