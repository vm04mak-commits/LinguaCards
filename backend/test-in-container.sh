#!/bin/sh
apk add --no-cache nodejs npm
cat > /tmp/test.js << 'EOF'
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'linguacards',
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully from inside container');
    const result = await client.query('SELECT COUNT(*) FROM decks');
    console.log('✅ Query result:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await pool.end();
  }
}

test();
EOF

cd /tmp
npm init -y > /dev/null 2>&1
npm install pg > /dev/null 2>&1
node test.js
