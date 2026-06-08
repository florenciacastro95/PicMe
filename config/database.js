require('dotenv').config();
const { Sequelize } = require('sequelize');
const pg = require('pg');
const sequelize = new Sequelize(
    process.env.DB_NAME || 'picme',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectModule: pg,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    }
);

module.exports = sequelize;