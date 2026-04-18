const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", (err) => { process.stderr.write(err.message + "\n"); });
module.exports = { query: (text, params) => pool.query(text, params), pool };
