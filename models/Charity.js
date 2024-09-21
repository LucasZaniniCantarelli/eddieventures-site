const db = require('../db');

const Charity = {
    create: (name, description, email, agencia, contaCorrente, banco, callback) => {
        const query = 'INSERT INTO charity_institutions (name, description, email, agencia, contaCorrente, banco) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [name, description, email, agencia, contaCorrente, banco], callback);
    },
    // Outros métodos de Charity podem ser adicionados aqui
};

module.exports = Charity;
