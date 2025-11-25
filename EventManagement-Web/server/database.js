const sql = require('mssql');

const dbConfig = {
    server: 'DESKTOP-3HK6G3K\\SQLEXPRESS',
    database: 'EventManagement',
    options: {
        trustServerCertificate: true,
        trustedConnection: true
    }
};

let pool;

async function connectDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
}

async function query(sqlQuery) {
    try {
        const result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
}

module.exports = { connectDB, query, sql };