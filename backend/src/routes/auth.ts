import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/token';

const router = Router();

const credsSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6)
});

router.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = credsSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, passwordHash: hash });
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.json({ accessToken, refreshToken });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = credsSchema.pick({ email: true, password: true }).parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.json({ accessToken, refreshToken });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

export default router;
