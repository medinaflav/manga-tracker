import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ sub: userId, type: 'refresh' }, env.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret) as { sub: string; type?: string };
};
