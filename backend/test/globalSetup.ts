import pg from 'pg';

export async function setup() {
  const client = new pg.Client('postgresql://postgres:postgres@localhost:5432/postgres');
  await client.connect();
  try {
    await client.query('CREATE DATABASE mydocs_test');
  } catch (err: any) {
    if (err.code !== '42P04') throw err; // 42P04 = duplicate_database, ignore
  } finally {
    await client.end();
  }
}
