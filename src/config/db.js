const sql = require('mssql');

const config = {
  server: '127.0.0.1',
  port: 1433,
  database: 'constructora',
  user: 'sa',
  password: 'Constructora2026!',
  options: {
    trustServerCertificate: true,
    encrypt: false
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
