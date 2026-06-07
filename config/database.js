require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'picme',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);
console.log({
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT
});
module.exports = sequelize;