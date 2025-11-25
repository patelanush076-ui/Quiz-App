import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import apiRoutes from "./routes/apiRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return next();
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch (e) {
    // ignore invalid token
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

app.listen(4000, () => console.log("Backend running on http://localhost:4000"));
