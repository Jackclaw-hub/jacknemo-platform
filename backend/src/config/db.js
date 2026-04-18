const { Pool } = require("pg");
const { databaseUrl } = require("./env");

const pool = new Pool({ connectionString: databaseUrl });
pool.on("error", (err) => process.stderr.write(err.message));

module.exports = { query: (text, params) => pool.query(text, params), pool };
