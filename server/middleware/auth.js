const jwt = require("jsonwebtoken");
const { dbGet } = require("../database");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Send error response with consistent format
 */
function sendError(res, code, message, details = null) {
  const response = {
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV === "development") {
    response.details = details;
  }

  return res.status(code).json(response);
}

/**
 * Async handler wrapper to catch errors
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * JWT Authentication middleware
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Missing or invalid Authorization header");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return sendError(res, 401, "Invalid or expired token");
    }

    try {
      // Verify user still exists and is verified
      const user = await dbGet(
        "SELECT id, phone, name, username, is_verified FROM users WHERE id = ? AND is_verified = 1",
        [decoded.id]
      );

      if (!user) {
        console.error("Auth error: User not found or not verified", {
          decodedId: decoded.id,
          timestamp: new Date().toISOString(),
        });
        return sendError(res, 401, "User not found or not verified");
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Authentication database error:", {
        message: error.message,
        stack: error.stack,
        decodedId: decoded?.id,
        timestamp: new Date().toISOString(),
      });
      return sendError(res, 500, "Authentication error", error.message);
    }
  });
}

/**
 * Optional JWT Authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      try {
        const user = await dbGet(
          "SELECT id, phone, name, username, is_verified FROM users WHERE id = ? AND is_verified = '1'",
          [decoded.id]
        );
        req.user = user;
      } catch (error) {
        req.user = null;
      }
    }
    next();
  });
}

/**
 * Role-based authorization middleware
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }

    if (Array.isArray(roles) && !roles.includes(req.user.role)) {
      return sendError(res, 403, "Insufficient permissions");
    }

    if (typeof roles === "string" && req.user.role !== roles) {
      return sendError(res, 403, "Insufficient permissions");
    }

    next();
  };
}

/**
 * Rate limiting middleware (simple in-memory version)
 */
function rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests
        .get(key)
        .filter((time) => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];

    if (userRequests.length >= maxRequests) {
      return sendError(res, 429, "Too many requests");
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
}

/**
 * Validation middleware using express-validator results
 */
function validateRequest(req, res, next) {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, 400, "Validation failed", errors.array());
  }

  next();
}

module.exports = {
  sendError,
  asyncHandler,
  authenticateJWT,
  optionalAuth,
  requireRole,
  rateLimit,
  validateRequest,
};
