const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Database connection configuration (must be provided by Easypanel/env)
const dbConfig = {
  host: requireEnv('DB_HOST'),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

function splitStatements(sql) {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
}

async function runMigration() {
  const migrationsDir = path.join(__dirname, '../migrations');

  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => /^\d+_.*\.sql$/.test(f))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    console.log(`Running ${files.length} migrations...`);

    const pool = mysql.createPool(dbConfig);

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`\n==> ${file}`);

      const statements = splitStatements(sql);
      for (const statement of statements) {
        await pool.execute(statement);
      }
    }

    console.log('\nMigrations completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
