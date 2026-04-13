const { Pool } = require('pg');

// Connection string from the instructions
const connectionString = 'postgresql://jackuser:jackdb_secure_2026@145.223.81.163:5432/jacknemo_dev';

// Read the schema.sql file
const fs = require('fs');
const schema = fs.readFileSync('/sandbox/.openclaw-data/workspace/schema.sql', 'utf8');

async function executeSchema() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log('Connecting to database...');
    await pool.connect();
    console.log('Connected successfully');
    
    console.log('Executing schema...');
    await pool.query(schema);
    console.log('Schema executed successfully!');
    
    // Verify tables were created
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Created tables:');
    rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeSchema();