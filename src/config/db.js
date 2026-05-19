const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'constructora',
  user: 'sa',
  password: 'Admin1234',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    instanceName: 'SQLEXPRESS'
  },
  connectionTimeout: 30000
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