// ============================================================================
// HOLA APP - IMPROVED EXPRESS SERVER WITH MYSQL
// ============================================================================

const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// Import custom modules
const {
  dbGet,
  dbRun,
  dbAll,
  dbCount,
  dbExists,
  dbInsert,
  dbUpdate,
  dbDelete,
  dbPaginate,
  dbTransaction,
} = require("./database");

// Import route modules
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contacts");
const callRoutes = require("./routes/calls");
const { router: messageRoutes, setSocketIO } = require("./routes/messages");

// Import middleware
const { authenticateJWT, asyncHandler } = require("./middleware/auth");
const { socketHandler } = require("./middleware/socket");
const { uploadMiddleware } = require("./middleware/upload");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// ============================================================================
// APP INITIALIZATION
// ============================================================================

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Early diagnostics
console.log("[BOOT] Environment check:", {
  AGORA_APP_ID: !!process.env.AGORA_APP_ID,
  AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
  JWT_SECRET: !!process.env.JWT_SECRET,
  DB_HOST: !!process.env.DB_HOST,
  DB_NAME: !!process.env.DB_NAME,
});

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    database: "MySQL",
  });
});

// Environment health check
app.get("/api/env-health", (req, res) => {
  res.json({
    AGORA_APP_ID: !!process.env.AGORA_APP_ID,
    AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
    JWT_SECRET: !!process.env.JWT_SECRET,
    database: "connected",
  });
});

// Mount route modules
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/messages", messageRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("[ERROR]", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : "Internal server error",
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🔄 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n🔄 SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

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
