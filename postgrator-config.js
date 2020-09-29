require('dotenv').config();

module.exports = {
    "migrationDirectory": "migrations",
    'validateChecksums': false,
    "driver": "pg",
  "connectionString": (process.env.NODE_ENV === 'test')
     ? process.env.TEST_DATABASE_URL
     : process.env.DATABASE_URL,
  }