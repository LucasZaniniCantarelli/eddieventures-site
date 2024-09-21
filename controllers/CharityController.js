const Charity = require('../models/Charity');

const CharityController = {
    create: (req, res) => {
        const { name, description, email, agencia, contaCorrente, banco } = req.body;

        if (!name || !email || !agencia || !contaCorrente || !banco) {
            return res.status(400).send('Todos os campos são obrigatórios.');
        }

        // Chama o model para criar a instituição de caridade
        Charity.create(name, description, email, agencia, contaCorrente, banco, (err, result) => {
            if (err) {
                console.error('Erro ao cadastrar instituição:', err);
                return res.status(500).send('Erro ao cadastrar instituição.');
            }
            res.status(201).send('Instituição cadastrada com sucesso.');
        });
    }
};

module.exports = CharityController;
