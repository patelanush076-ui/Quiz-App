import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import apiRoutes from "./routes/apiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { tokenBlacklist } from "./controllers/authController.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function authMiddleware(req, res, next) {
  const h = req.headers.authorization;

  // If no authorization header, continue without user
  if (!h || !h.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = h.slice(7);

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch (e) {
    // Invalid token, continue without user
    req.user = null;
  }

  next();
}

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(authMiddleware);

// Routes
app.use("/api", apiRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// app.listen(4000, () => console.log("Backend running on http://localhost:4000"));
export default app;

export { requireAuth };
