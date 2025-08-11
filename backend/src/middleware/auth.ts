import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization header' });
  const token = header.split(' ')[1];
  try {
    const payload = verifyToken(token);
    if (payload.type && payload.type !== 'access') throw new Error('Invalid token type');
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
