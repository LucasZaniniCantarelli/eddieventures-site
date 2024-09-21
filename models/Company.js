const db = require('../db');

const Company = {
    create: (name, cnpj, email, password, callback) => {
        const query = 'INSERT INTO companies (name, cnpj, email, password) VALUES (?, ?, ?, ?)';
        db.query(query, [name, cnpj, email, password], callback);
    },
    // Outros métodos de Company podem ser adicionados aqui
};

module.exports = Company;
