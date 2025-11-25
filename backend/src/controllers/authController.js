import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

function generateToken(user) {
  return jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function validateInput(name, password) {
  const errors = [];

  if (!name || typeof name !== "string") {
    errors.push("Username is required");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }
    if (trimmed.length > 50) {
      errors.push("Username must be less than 50 characters");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      errors.push(
        "Username can only contain letters, numbers, hyphens, and underscores"
      );
    }
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else {
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    if (password.length > 100) {
      errors.push("Password must be less than 100 characters");
    }
  }

  return errors;
}

// Sign up
export const signup = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate input
    const errors = validateInput(name, password);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const trimmedName = name.trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { name: trimmedName },
    });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hash = bcrypt.hashSync(password, 12); // Increased salt rounds

    const user = await prisma.user.create({
      data: { name: trimmedName, passwordHash: hash },
    });
    const token = generateToken(user);
    res.json({ user: { id: user.id, name: user.name }, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Basic validation
    if (!name || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const trimmedName = name.trim();

    const user = await prisma.user.findUnique({ where: { name: trimmedName } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid password" });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "No token provided" });
    }

    const token = authHeader.slice(7);

    // Add token to blacklist
    tokenBlacklist.add(token);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Export blacklist for middleware use
export { tokenBlacklist };
