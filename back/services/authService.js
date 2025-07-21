const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = [];

async function register(username, password) {
  if (!username || !password) {
    throw new Error("Username and password required");
  }
  const existing = users.find((u) => u.username === username);
  if (existing) {
    throw new Error("User already exists");
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { username, password: hashed };
  users.push(user);
  return { message: "User registered" };
}

async function login(username, password) {
  const user = users.find((u) => u.username === username);
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
  return { token };
}

module.exports = { register, login };
