require('dotenv').config();

const { Usuario, sequelize } = require('../models');

async function test() {

    try {

        await sequelize.authenticate();

        const usuario = await Usuario.create({
            username: 'florencia',
            email: 'flor@ulp.com',
            password: '123456',
            nombre: 'Florencia'
        });

        console.log(usuario.toJSON());

    } catch (error) {

        console.error(error);

    } finally {

        await sequelize.close();

    }

}

test();