require('dotenv').config();
const express = require("express");
const { setupSwagger } = require('./swagger');
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { securityHeaders, sanitizeBody, checkBlacklist } = require("./middleware/security");
const authRouter = require("./routes/auth");
const foundersRouter = require("./routes/founders");
const listingsRouter = require("./routes/listings");
const radarRouter = require("./routes/radar");
const adminRouter = require("./routes/admin");
const providersRouter = require("./routes/providers");
const messagesRouter = require("./routes/messages");
const notificationsRouter = require("./routes/notifications");
const { authenticateToken } = require("./middleware/auth");
const paymentsRouter = require("./routes/payments");
const { startPremiumExpiryCron } = require("./jobs/premiumExpiry");
const { startExpiryReminderCron } = require("./jobs/expiryReminder");
const { authLimiter, listingsWriteLimiter, messageLimiter, generalLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  credentials: true
}));
app.use(express.json({
  limit: "1mb",
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.startsWith("/api/payments/webhook")) {
      req.rawBody = buf;
    }
  }
}));
app.use(morgan("combined"));
app.use(securityHeaders);
app.use(sanitizeBody);
app.use(checkBlacklist);

// K-26: Public landing page
app.use(express.static(require('path').join(__dirname, '../public')));
app.use(express.static(require('path').join(__dirname, '../../frontend')));

app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.use("/api/payments", paymentsRouter);

// K-32: Per-endpoint rate limiting
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/founders", authenticateToken, foundersRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/radar", radarRouter);
app.use("/api/admin", adminRouter);
app.use("/api/providers", providersRouter);
app.use("/api/messages", messageLimiter, messagesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api", generalLimiter);

setupSwagger(app);
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  startPremiumExpiryCron();
  startExpiryReminderCron();
  app.listen(PORT, () => console.log(`NemoClaw backend running on port ${PORT}`));
}

module.exports = app;
