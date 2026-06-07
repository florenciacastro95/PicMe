require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {

    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: 'postgres'
    });

    try {

        await client.connect();

        const dbName = process.env.DB_NAME || 'picme';

        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );

        if (result.rows.length === 0) {
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`Bd ${dbName} creada`);
        } else {
            console.log(`La base de datos ${dbName} a existe`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

createDatabase();