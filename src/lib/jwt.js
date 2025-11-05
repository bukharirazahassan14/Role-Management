// lib/jwt.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "3f1c8d7e29a84b4db8f2b9e5f92b1dfe6c47991e1a63c5e28e7e0a34f5d9f4d2"; // ⚠️ use env var in production

// Generate token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role?.name || user.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Verify token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
