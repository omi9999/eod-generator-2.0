import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Simple token validation (in production, use JWT)
    if (token !== process.env.API_TOKEN && process.env.NODE_ENV === 'production') {
      throw new AppError('Invalid token', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};