import { Router, Request, Response } from 'express';
import { ClientService } from '../services/client.service';
import { JWTUtils } from '../utils/jwt';
import { authenticate, requireAuth, refreshTokenIfNeeded } from '../middleware/auth.middleware';

const router = Router();
const clientService = new ClientService();

/**
 * POST /api/clients/register
 * Register a new client with email validation and access code generation
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, company } = req.body;

    // Register client
    const result = await clientService.registerClient({
      name,
      email,
      company
    });

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      data: {
        client: result.client,
        accessCode: result.accessCode
      }
    });
  } catch (error) {
    console.error('Client registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = errorMessage.includes('already exists') ? 409 : 
                      errorMessage.includes('Validation error') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/clients/login
 * Authenticate client with email and access code, generate JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, accessCode } = req.body;

    // Authenticate client
    const client = await clientService.authenticateClient({
      email,
      accessCode
    });

    if (!client) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or access code'
      });
    }

    // Generate JWT token
    const tokenResponse = JWTUtils.generateToken(client.id, client.email);

    // Remove access code from response for security
    const { accessCode: _, ...clientData } = client;

    return res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        client: clientData,
        token: tokenResponse.token,
        expiresIn: tokenResponse.expiresIn
      }
    });
  } catch (error) {
    console.error('Client authentication error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    const statusCode = errorMessage.includes('Validation error') ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});/**

 * GET /api/clients/validate/:email
 * Check if a client exists by email (for validation purposes)
 */
router.get('/validate/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const client = await clientService.findClientByEmail(email);

    res.json({
      success: true,
      data: {
        exists: !!client,
        clientId: client?.id || null
      }
    });
  } catch (error) {
    console.error('Client validation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Validation failed';
    const statusCode = errorMessage.includes('Invalid email') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * GET /api/clients/profile
 * Get authenticated client's profile
 */
router.get('/profile', authenticate, refreshTokenIfNeeded, async (req: Request, res: Response) => {
  try {
    if (!req.client) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return res.json({
      success: true,
      data: {
        client: req.client
      }
    });
  } catch (error) {
    console.error('Client profile error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve client profile'
    });
  }
});

/**
 * GET /api/clients/profile/:id
 * Get client profile by ID (protected route)
 */
router.get('/profile/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only allow clients to access their own profile
    if (req.client?.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: insufficient permissions'
      });
    }

    const client = await clientService.findClientById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Remove access code from response for security
    const { accessCode: _, ...clientData } = client;

    return res.json({
      success: true,
      data: {
        client: clientData
      }
    });
  } catch (error) {
    console.error('Client profile error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve client profile'
    });
  }
});

/**
 * POST /api/clients/verify-token
 * Verify JWT token validity
 */
router.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    try {
      const payload = JWTUtils.verifyToken(token);
      
      // Verify client still exists
      const client = await clientService.findClientById(payload.clientId);
      if (!client) {
        return res.status(401).json({
          success: false,
          error: 'Client not found or access revoked'
        });
      }

      return res.json({
        success: true,
        data: {
          valid: true,
          clientId: payload.clientId,
          email: payload.email
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      return res.status(401).json({
        success: false,
        error: errorMessage,
        data: {
          valid: false
        }
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

/**
 * POST /api/clients/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.client) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Generate new token
    const tokenResponse = JWTUtils.generateToken(req.client.id, req.client.email);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: tokenResponse.token,
        expiresIn: tokenResponse.expiresIn
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /api/clients/logout
 * Logout client (client-side should remove token)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    // Note: With JWT, we can't invalidate tokens server-side without maintaining a blacklist
    // For now, we'll just return success and rely on client-side token removal
    // In production, you might want to implement a token blacklist in Redis
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router;