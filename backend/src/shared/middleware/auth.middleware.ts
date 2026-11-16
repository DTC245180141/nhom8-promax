import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'ulms_super_secret_jwt_key_2026';

export interface AuthenticatedUser {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'LECTURER' | 'ADMIN';
  department: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Thiếu token xác thực' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Token không hợp lệ hoặc đã hết hạn' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Bạn không có quyền thực hiện thao tác này' });
      return;
    }
    next();
  };
}
