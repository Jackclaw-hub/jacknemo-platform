const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { securityHeaders } = require("./middleware/security");
const authRouter = require("./routes/auth");
const foundersRouter = require("./routes/founders");
const listingsRouter = require("./routes/listings");
const radarRouter = require("./routes/radar");
const adminRouter = require("./routes/admin");
const providersRouter = require("./routes/providers");
const { authenticateToken } = require("./middleware/auth");

const app = express();

// Global middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));
app.use(securityHeaders);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/founders", authenticateToken, foundersRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/radar", radarRouter);
app.use("/api/admin", adminRouter);
app.use("/api/providers", providersRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`NemoClaw backend running on port ${PORT}`));
}

module.exports = app;
