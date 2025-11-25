import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function generateToken(user) {
  return jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Sign up
export const signup = async (req, res) => {
  const { name, password } = req.body;

  console.log(req.body);
  const hash = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({ data: { name, passwordHash: hash } });
  const token = generateToken(user);
  res.json({ user: { id: user.id, name: user.name }, token });
};

// Login
export const login = async (req, res) => {
  const { name, password } = req.body;
  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) return res.status(404).json({ message: "User not found" });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid password" });
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, name: user.name } });
};
