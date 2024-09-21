const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const path = require('path');
const app = express();
const port = 3000;

// Importar rotas
const indexRoutes = require('./routes/index');
const empresaRoutes = require('./routes/empresa');
const adminRoutes = require('./routes/admin');

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

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;  // Se não houver usuário, define como null
    next();
});


// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Incluir as rotas
app.use('/', indexRoutes);
app.use('/empresa', empresaRoutes);
app.use('/admin', adminRoutes);
app.use('/', authRoutes);


// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em: http://localhost:${port}`);
});
