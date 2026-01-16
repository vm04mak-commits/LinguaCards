const { Pool } = require('pg');

async function test() {
  console.log('Testing with new user testuser...');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'testuser',
    password: 'testpass',
    database: 'linguacards',
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully');
    const result = await client.query('SELECT current_user, current_database()');
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
