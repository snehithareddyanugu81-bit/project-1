require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const donorRoutes = require("./routes/donors");
const requestRoutes = require("./routes/requests");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
  }
}}));
app.use(cors({ origin: false }));
app.use(express.json({ limit: "20kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", databaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) });
});
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found." });
  res.status(404).sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
app.use((error, _req, res, _next) => {
  // Keep details in server logs; never send provider/database internals to the browser.
  console.error("Request failed:", error.message || error);
  if (res.headersSent) return;
  res.status(500).json({ error: "An unexpected server error occurred. Please try again." });
});

app.listen(port, () => {
  console.log(`BloodLink running at http://localhost:${port}`);
});
