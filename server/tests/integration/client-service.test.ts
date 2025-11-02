import { ClientService } from '../../src/services/client.service';
import { ClientRepository } from '../../src/services/client.repository';

// Mock the ClientRepository
jest.mock('../../src/services/client.repository');

describe('ClientService', () => {
  let clientService: ClientService;
  let mockClientRepository: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create service instance
    clientService = new ClientService();
    
    // Get the mocked repository instance
    mockClientRepository = jest.mocked(ClientRepository.prototype);
  });

  describe('registerClient', () => {
    const validRegistrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Test Company'
    };

    it('should successfully register a new client', async () => {
      // Mock repository methods
      mockClientRepository.findByEmail.mockResolvedValue(null);
      mockClientRepository.findByAccessCode.mockResolvedValue(null);
      mockClientRepository.create.mockResolvedValue({
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Company',
        accessCode: 'ABC12345',
        createdAt: new Date()
      });

      const result = await clientService.registerClient(validRegistrationData);

      expect(result).toHaveProperty('client');
      expect(result).toHaveProperty('accessCode');
      expect(result.client.name).toBe('John Doe');
      expect(result.client.email).toBe('john@example.com');
      expect(result.accessCode).toMatch(/^[A-Z0-9]{8}$/);
      expect(mockClientRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockClientRepository.create).toHaveBeenCalled();
    });

    it('should throw error if client with email already exists', async () => {
      // Mock existing client
      mockClientRepository.findByEmail.mockResolvedValue({
        id: 'existing-client',
        name: 'Existing User',
        email: 'john@example.com',
        company: null,
        accessCode: 'EXISTING1',
        createdAt: new Date()
      });

      await expect(clientService.registerClient(validRegistrationData))
        .rejects.toThrow('A client with this email address already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        company: 'Test Company'
      };

      await expect(clientService.registerClient(invalidData))
        .rejects.toThrow('Validation error');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        name: 'John Doe',
        email: 'not-an-email',
        company: 'Test Company'
      };

      await expect(clientService.registerClient(invalidEmailData))
        .rejects.toThrow('Please provide a valid email address');
    });

    it('should handle optional company field', async () => {
      const dataWithoutCompany = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      mockClientRepository.findByEmail.mockResolvedValue(null);
      mockClientRepository.findByAccessCode.mockResolvedValue(null);
      mockClientRepository.create.mockResolvedValue({
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: null,
        accessCode: 'ABC12345',
        createdAt: new Date()
      });

      const result = await clientService.registerClient(dataWithoutCompany);

      expect(result.client.company).toBeNull();
      expect(mockClientRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        company: null,
        accessCode: expect.any(String)
      });
    });
  });

  describe('authenticateClient', () => {
    const validAuthData = {
      email: 'john@example.com',
      accessCode: 'ABC12345'
    };

    it('should successfully authenticate valid credentials', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Company',
        accessCode: 'ABC12345',
        createdAt: new Date()
      };

      mockClientRepository.authenticate.mockResolvedValue(mockClient);

      const result = await clientService.authenticateClient(validAuthData);

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.authenticate).toHaveBeenCalledWith('john@example.com', 'ABC12345');
    });

    it('should return null for invalid credentials', async () => {
      mockClientRepository.authenticate.mockResolvedValue(null);

      const result = await clientService.authenticateClient(validAuthData);

      expect(result).toBeNull();
    });

    it('should validate email format', async () => {
      const invalidAuthData = {
        email: 'not-an-email',
        accessCode: 'ABC12345'
      };

      await expect(clientService.authenticateClient(invalidAuthData))
        .rejects.toThrow('Please provide a valid email address');
    });

    it('should validate access code length', async () => {
      const invalidAuthData = {
        email: 'john@example.com',
        accessCode: 'SHORT'
      };

      await expect(clientService.authenticateClient(invalidAuthData))
        .rejects.toThrow('Access code must be exactly 8 characters');
    });
  });

  describe('findClientByEmail', () => {
    it('should find client by valid email', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: null,
        accessCode: 'ABC12345',
        createdAt: new Date()
      };

      mockClientRepository.findByEmail.mockResolvedValue(mockClient);

      const result = await clientService.findClientByEmail('john@example.com');

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
    });

    it('should validate email format', async () => {
      await expect(clientService.findClientByEmail('invalid-email'))
        .rejects.toThrow('Invalid email format');
    });
  });

  describe('findClientByAccessCode', () => {
    it('should find client by valid access code', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: null,
        accessCode: 'ABC12345',
        createdAt: new Date()
      };

      mockClientRepository.findByAccessCode.mockResolvedValue(mockClient);

      const result = await clientService.findClientByAccessCode('ABC12345');

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.findByAccessCode).toHaveBeenCalledWith('ABC12345');
    });

    it('should validate access code format', async () => {
      await expect(clientService.findClientByAccessCode('SHORT'))
        .rejects.toThrow('Invalid access code format');
    });
  });

  describe('access code generation', () => {
    it('should generate unique access codes', async () => {
      // Mock that first code exists, second doesn't
      mockClientRepository.findByAccessCode
        .mockResolvedValueOnce({
          id: 'existing',
          name: 'Existing',
          email: 'existing@example.com',
          company: null,
          accessCode: 'EXISTING',
          createdAt: new Date()
        })
        .mockResolvedValueOnce(null);

      mockClientRepository.findByEmail.mockResolvedValue(null);
      mockClientRepository.create.mockResolvedValue({
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: null,
        accessCode: 'UNIQUE12',
        createdAt: new Date()
      });

      const result = await clientService.registerClient({
        name: 'John Doe',
        email: 'john@example.com'
      });

      // Should have called findByAccessCode at least twice (once for existing, once for unique)
      expect(mockClientRepository.findByAccessCode).toHaveBeenCalledTimes(2);
      expect(result.accessCode).toMatch(/^[A-Z0-9]{8}$/);
    });
  });
});