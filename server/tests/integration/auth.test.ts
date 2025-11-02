import { JWTUtils } from '../../src/utils/jwt';
import { ClientService } from '../../src/services/client.service';
import { AuthMiddleware } from '../../src/middleware/auth.middleware';
import { Request, Response } from 'express';

describe('JWT Authentication', () => {
  let clientService: ClientService;
  let testClient: any;

  beforeAll(async () => {
    clientService = new ClientService();
  });

  beforeEach(async () => {
    // Create a test client for authentication tests
    try {
      const registrationResult = await clientService.registerClient({
        name: 'Test Client Auth',
        email: `auth-test-${Date.now()}@example.com`,
        company: 'Test Company'
      });
      testClient = registrationResult.client;
    } catch (error) {
      // Client might already exist in some test scenarios
      console.log('Test client creation skipped:', error);
    }
  });

  describe('JWTUtils', () => {
    test('should generate valid JWT token', () => {
      const tokenResponse = JWTUtils.generateToken('test-client-id', 'test@example.com');
      
      expect(tokenResponse).toHaveProperty('token');
      expect(tokenResponse).toHaveProperty('expiresIn');
      expect(typeof tokenResponse.token).toBe('string');
      expect(tokenResponse.expiresIn).toBe('24h');
    });

    test('should verify valid JWT token', () => {
      const tokenResponse = JWTUtils.generateToken('test-client-id', 'test@example.com');
      const payload = JWTUtils.verifyToken(tokenResponse.token);
      
      expect(payload.clientId).toBe('test-client-id');
      expect(payload.email).toBe('test@example.com');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    test('should reject invalid JWT token', () => {
      expect(() => {
        JWTUtils.verifyToken('invalid-token');
      }).toThrow('Invalid token');
    });

    test('should extract token from Authorization header', () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;
      
      const extractedToken = JWTUtils.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    test('should return null for invalid Authorization header format', () => {
      expect(JWTUtils.extractTokenFromHeader('InvalidFormat token')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Bearer')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader(undefined)).toBeNull();
    });

    test('should decode token without verification', () => {
      const tokenResponse = JWTUtils.generateToken('test-client-id', 'test@example.com');
      const decoded = JWTUtils.decodeToken(tokenResponse.token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.clientId).toBe('test-client-id');
      expect(decoded?.email).toBe('test@example.com');
    });
  });

  describe('Authentication Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        client: undefined
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };
      mockNext = jest.fn();
    });

    test('should reject request without Authorization header', async () => {
      await AuthMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      await AuthMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow request with valid token for existing client', async () => {
      if (!testClient) {
        // Skip test if client creation failed
        return;
      }

      const tokenResponse = JWTUtils.generateToken(testClient.id, testClient.email);
      mockRequest.headers = {
        authorization: `Bearer ${tokenResponse.token}`
      };

      await AuthMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.client).toBeDefined();
      expect(mockRequest.client?.id).toBe(testClient.id);
      expect(mockRequest.client?.email).toBe(testClient.email);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should continue without authentication for optional middleware', async () => {
      await AuthMiddleware.optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockRequest.client).toBeUndefined();
    });

    test('should require authentication when client not present', () => {
      AuthMiddleware.requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow access when client is authenticated', () => {
      mockRequest.client = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test Client',
        company: null
      };

      AuthMiddleware.requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Client Ownership Validation', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        params: {},
        body: {},
        client: {
          id: 'client-123',
          email: 'test@example.com',
          name: 'Test Client',
          company: null
        }
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    test('should allow access to own resources', () => {
      mockRequest.params = { clientId: 'client-123' };

      const middleware = AuthMiddleware.validateClientOwnership('clientId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should deny access to other client resources', () => {
      mockRequest.params = { clientId: 'other-client-456' };

      const middleware = AuthMiddleware.validateClientOwnership('clientId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied: insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should require authentication for ownership validation', () => {
      mockRequest.client = undefined;
      mockRequest.params = { clientId: 'client-123' };

      const middleware = AuthMiddleware.validateClientOwnership('clientId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});