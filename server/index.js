// ============================================================================
// HOLA APP - IMPROVED EXPRESS SERVER WITH MYSQL
// ============================================================================

const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// Import route modules
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contacts");
const callRoutes = require("./routes/calls");
const { router: messageRoutes, setSocketIO } = require("./routes/messages");

// Import middleware
const { socketHandler } = require("./middleware/socket");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// ============================================================================
// APP INITIALIZATION
// ============================================================================

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Environment validation
const requiredEnvVars = {
  AGORA_APP_ID: !!process.env.AGORA_APP_ID,
  AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
  JWT_SECRET: !!process.env.JWT_SECRET,
  DB_HOST: !!process.env.DB_HOST,
  DB_NAME: !!process.env.DB_NAME,
  DB_USER: !!process.env.DB_USER,
  DB_PASSWORD: !!process.env.DB_PASSWORD,
  DB_PORT: !!process.env.DB_PORT,
  TRUECALLER_API_KEY: !!process.env.TRUECALLER_API_KEY,
};

console.log("[BOOT] Environment check:", requiredEnvVars);

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Common CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================

const io = new Server(server, {
  cors: corsOptions, // Reuse CORS configuration
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize socket handling
socketHandler(io);

// Pass Socket.IO instance to message routes for real-time features
setSocketIO(io);

// ============================================================================
// API ROUTES
// ============================================================================

// Health check with environment status
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    database: "MySQL",
    environment: requiredEnvVars,
  });
});

// Mount route modules - matching frontend API calls exactly
app.use("/api", authRoutes); // Handles: /api/login, /api/register
app.use("/api", messageRoutes); // Handles: /api/conversations, /api/messages
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/call-logs", callRoutes); // Handles: /api/call-logs/*
app.use("/api", callRoutes); // Handles: /api/agora-token

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler - catch all unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  const isDevelopment = process.env.NODE_ENV === "development";

  console.error("[GLOBAL ERROR]", {
    message: error.message,
    stack: isDevelopment ? error.stack : error.stack.split("\n")[0],
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,
    userAgent: req.get("User-Agent"),
    timestamp,
    headers: isDevelopment ? req.headers : undefined,
    body: isDevelopment && req.method !== "GET" ? req.body : undefined,
  });

  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : "Internal server error",
    ...(isDevelopment && { stack: error.stack }),
    timestamp,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

server.listen(PORT, () => {
  console.log(`
🚀 Hola Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🗄️  Database: MySQL (mysql2)
⚡ Socket.IO: Enabled
🔧 Environment: ${process.env.NODE_ENV || "development"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n🔄 ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 UNHANDLED REJECTION at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = { app, server, io };
