const sql = require('mssql');

const config = {
  user: 'sa',
  password: '1704',
  server: '127.0.0.1',
  port: 1433,
  database: 'constructora',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log('Conectado OK');
  } catch (err) {
    console.error('Error:', err.message);
  }
};

module.exports = { sql, config, connectDB };