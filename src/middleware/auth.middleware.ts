import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'sysadmin' | 'execsysadmin';
  };
}
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
      console.log("requireAuth headers.authorization:", req.headers.authorization);
      console.log("requireAuth cookies:", req.cookies);

    const authHeader = req.headers.authorization;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        message: 'Unauthorized. Missing token.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      sub: string;
      email: string;
      role: 'user' | 'admin' | 'sysadmin' | 'execsysadmin';
    };

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      message: 'Unauthorized. Invalid or expired token.',
    });
  }
}
export function requireRole(
  ...allowedRoles: Array<'user' | 'admin' | 'sysadmin' | 'execsysadmin'>
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden. Insufficient permissions.',
      });
    }

    next();
  };
}

