import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwt';
import { ClientService } from '../services/client.service';

// Extend Express Request interface to include client data
declare global {
  namespace Express {
    interface Request {
      client?: {
        id: string;
        email: string;
        name: string;
        company?: string | null;
      };
    }
  }
}

/**
 * Authentication middleware for protecting routes
 */
export class AuthMiddleware {
  private static clientService = new ClientService();

  /**
   * Middleware to authenticate JWT tokens
   */
  static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract token from Authorization header
      const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Access token is required'
        });
        return;
      }

      // Verify token
      let payload: JWTPayload;
      try {
        payload = JWTUtils.verifyToken(token);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
        res.status(401).json({
          success: false,
          error: errorMessage
        });
        return;
      }

      // Verify client still exists and is valid
      const client = await AuthMiddleware.clientService.findClientById(payload.clientId);
      if (!client) {
        res.status(401).json({
          success: false,
          error: 'Client not found or access revoked'
        });
        return;
      }

      // Verify email matches (additional security check)
      if (client.email !== payload.email) {
        res.status(401).json({
          success: false,
          error: 'Token validation failed'
        });
        return;
      }

      // Attach client data to request object (without access code)
      req.client = {
        id: client.id,
        email: client.email,
        name: client.name,
        company: client.company
      };

      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Optional authentication middleware - doesn't fail if no token provided
   */
  static async optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
      
      if (!token) {
        // No token provided, continue without authentication
        next();
        return;
      }

      // Try to verify token, but don't fail if invalid
      try {
        const payload = JWTUtils.verifyToken(token);
        const client = await AuthMiddleware.clientService.findClientById(payload.clientId);
        
        if (client && client.email === payload.email) {
          req.client = {
            id: client.id,
            email: client.email,
            name: client.name,
            company: client.company
          };
        }
      } catch {
        // Invalid token, but continue without authentication
      }

      next();
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      // Continue without authentication on error
      next();
    }
  }

  /**
   * Middleware to check if client is authenticated
   */
  static requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.client) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    next();
  }

  /**
   * Middleware to validate client ownership of resource
   */
  static validateClientOwnership(clientIdParam: string = 'clientId') {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.client) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const resourceClientId = req.params[clientIdParam] || req.body[clientIdParam];
      
      if (req.client.id !== resourceClientId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: insufficient permissions'
        });
        return;
      }

      next();
    };
  }

  /**
   * Middleware to refresh token if it's close to expiry
   */
  static async refreshTokenIfNeeded(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
      
      if (!token || !req.client) {
        next();
        return;
      }

      const decoded = JWTUtils.decodeToken(token);
      if (!decoded || !decoded.exp) {
        next();
        return;
      }

      // Check if token expires within the next hour
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      const oneHour = 60 * 60;

      if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
        // Generate new token
        const tokenResponse = JWTUtils.generateToken(req.client.id, req.client.email);
        
        // Add new token to response headers
        res.setHeader('X-New-Token', tokenResponse.token);
        res.setHeader('X-Token-Expires-In', tokenResponse.expiresIn);
      }

      next();
    } catch (error) {
      console.error('Token refresh middleware error:', error);
      // Continue without refresh on error
      next();
    }
  }
}

// Export individual middleware functions for convenience
export const authenticate = AuthMiddleware.authenticate;
export const optionalAuthenticate = AuthMiddleware.optionalAuthenticate;
export const requireAuth = AuthMiddleware.requireAuth;
export const validateClientOwnership = AuthMiddleware.validateClientOwnership;
export const refreshTokenIfNeeded = AuthMiddleware.refreshTokenIfNeeded;