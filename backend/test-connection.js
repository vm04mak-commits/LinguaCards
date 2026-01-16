const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing PostgreSQL connection...\n');

  // Test 1: With connection string
  console.log('Test 1: Connection string');
  const pool1 = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/linguacards',
  });

  try {
    const client = await pool1.connect();
    console.log('✅ Connected with connection string');
    await client.query('SELECT 1');
    console.log('✅ Query successful');
    client.release();
  } catch (error) {
    console.error('❌ Connection string failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await pool1.end();
  }

  console.log('\nTest 2: Individual parameters');
  const pool2 = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'linguacards',
  });

  try {
    const client = await pool2.connect();
    console.log('✅ Connected with individual parameters');
    await client.query('SELECT 1');
    console.log('✅ Query successful');
    client.release();
  } catch (error) {
    console.error('❌ Individual parameters failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await pool2.end();
  }

  console.log('\nTest 3: With 127.0.0.1 instead of localhost');
  const pool3 = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'linguacards',
  });

  try {
    const client = await pool3.connect();
    console.log('✅ Connected with 127.0.0.1');
    await client.query('SELECT 1');
    console.log('✅ Query successful');
    client.release();
  } catch (error) {
    console.error('❌ 127.0.0.1 failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await pool3.end();
  }

  console.log('\nTest 4: Without password (trust auth)');
  const pool4 = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'linguacards',
  });

  try {
    const client = await pool4.connect();
    console.log('✅ Connected without password');
    await client.query('SELECT 1');
    console.log('✅ Query successful');
    client.release();
  } catch (error) {
    console.error('❌ Without password failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await pool4.end();
  }

  console.log('\nTest 5: With password and ssl: false');
  const pool5 = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'linguacards',
    ssl: false,
  });

  try {
    const client = await pool5.connect();
    console.log('✅ Connected with ssl: false');
    await client.query('SELECT 1');
    console.log('✅ Query successful');
    client.release();
  } catch (error) {
    console.error('❌ ssl: false failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await pool5.end();
  }
}

testConnection().catch(console.error);
