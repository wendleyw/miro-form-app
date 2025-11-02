import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JWTPayload {
  clientId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  token: string;
  expiresIn: string;
}

/**
 * JWT utility class for token generation and validation
 */
export class JWTUtils {
  private static readonly JWT_EXPIRES_IN = '24h';
  private static readonly JWT_SECRET = config.server.jwtSecret;

  /**
   * Generate JWT token for authenticated client
   */
  static generateToken(clientId: string, email: string): TokenResponse {
    const payload: JWTPayload = {
      clientId,
      email
    };

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'ticket-management-system',
      audience: 'client'
    });

    return {
      token,
      expiresIn: this.JWT_EXPIRES_IN
    };
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'ticket-management-system',
        audience: 'client'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Check if token is expired (without throwing error)
   */
  static isTokenExpired(token: string): boolean {
    try {
      jwt.verify(token, this.JWT_SECRET);
      return false;
    } catch (error) {
      return error instanceof jwt.TokenExpiredError;
    }
  }

  /**
   * Decode token without verification (for debugging purposes)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}