const Company = require('../models/Company');

const CompanyController = {
    create: (req, res) => {
        const { name, cnpj, email, password } = req.body;

        if (!name || !cnpj || !email || !password) {
            return res.status(400).send('Todos os campos são obrigatórios.');
        }

        // Remove caracteres não numéricos do CNPJ
        const formattedCnpj = cnpj.replace(/[^\d]/g, '');

        // Chama o model para criar a empresa
        Company.create(name, formattedCnpj, email, password, (err, result) => {
            if (err) {
                console.error('Erro ao cadastrar empresa:', err);
                return res.status(500).send('Erro ao cadastrar empresa.');
            }
            res.status(201).send('Empresa cadastrada com sucesso.');
        });
    }
};

module.exports = CompanyController;
