require('dotenv').config();
const { sequelize } = require('../models');

async function syncDatabase() {

    try {

        await sequelize.authenticate();

        await sequelize.sync({ force: true });


    } catch (error) {

        console.error(error);

    } finally {

        await sequelize.close();

    }
}

syncDatabase();