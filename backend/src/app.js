require("dotenv").config();
const express = require("express");
const healthRouter = require("./routes/health.routes");
const authRouter = require("./routes/auth.routes");

const app = express();
app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

const { port } = require("./config/env");
if (require.main === module) {
  app.listen(port);
}
module.exports = app;
