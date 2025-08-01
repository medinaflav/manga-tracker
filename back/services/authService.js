const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  expoPushToken: { type: String, default: null }, // Ajout du token Expo Push
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

async function register(username, password) {
  if (!username || !password) {
    throw new Error("Username and password required");
  }
  const existing = await User.findOne({ username });
  if (existing) {
    throw new Error("User already exists");
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();
  return { message: "User registered" };
}

async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("User not found");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid password");
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
  return { token };
}

async function updateExpoPushToken(username, expoPushToken) {
  if (!username || !expoPushToken) {
    throw new Error("Username and expoPushToken required");
  }
  await User.findOneAndUpdate(
    { username },
    { $set: { expoPushToken } },
    { new: true }
  );
}

module.exports = { register, login, updateExpoPushToken, User };
