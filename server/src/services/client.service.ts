import { Client } from '@prisma/client';
import { ClientRepository } from './client.repository';
import crypto from 'crypto';
import Joi from 'joi';

export interface ClientRegistrationData {
  name: string;
  email: string;
  company?: string;
}

export interface ClientAuthenticationData {
  email: string;
  accessCode: string;
}

export interface ClientRegistrationResponse {
  client: Omit<Client, 'accessCode'>;
  accessCode: string;
}

/**
 * Service for client management operations
 */
export class ClientService {
  private clientRepository: ClientRepository;

  constructor() {
    this.clientRepository = new ClientRepository();
  }

  /**
   * Validation schema for client registration
   */
  private registrationSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    company: Joi.string().max(100).optional().messages({
      'string.max': 'Company name cannot exceed 100 characters'
    })
  });

  /**
   * Validation schema for client authentication
   */
  private authenticationSchema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    accessCode: Joi.string().length(8).required().messages({
      'string.length': 'Access code must be exactly 8 characters',
      'any.required': 'Access code is required'
    })
  });

  /**
   * Generate a unique 8-character access code
   */
  private generateAccessCode(): string {
    // Generate a random 8-character alphanumeric code (uppercase)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Generate a unique access code that doesn't exist in the database
   */
  private async generateUniqueAccessCode(): Promise<string> {
    let accessCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      accessCode = this.generateAccessCode();
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique access code after multiple attempts');
      }
      
      const existingClient = await this.clientRepository.findByAccessCode(accessCode);
      if (!existingClient) {
        break;
      }
    } while (true);

    return accessCode;
  }

  /**
   * Register a new client with email validation and access code generation
   */
  async registerClient(data: ClientRegistrationData): Promise<ClientRegistrationResponse> {
    // Validate input data
    const { error, value } = this.registrationSchema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const validatedData = value as ClientRegistrationData;

    // Check if client with this email already exists
    const existingClient = await this.clientRepository.findByEmail(validatedData.email);
    if (existingClient) {
      throw new Error('A client with this email address already exists');
    }

    // Generate unique access code
    const accessCode = await this.generateUniqueAccessCode();

    // Create client
    const client = await this.clientRepository.create({
      name: validatedData.name,
      email: validatedData.email,
      company: validatedData.company || null,
      accessCode
    });

    // Return client data without exposing access code in the main client object
    const { accessCode: _, ...clientWithoutAccessCode } = client;
    
    return {
      client: clientWithoutAccessCode,
      accessCode
    };
  }

  /**
   * Authenticate client with email and access code
   */
  async authenticateClient(data: ClientAuthenticationData): Promise<Client | null> {
    // Validate input data
    const { error, value } = this.authenticationSchema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const validatedData = value as ClientAuthenticationData;

    // Authenticate client
    const client = await this.clientRepository.authenticate(
      validatedData.email,
      validatedData.accessCode
    );

    return client;
  }

  /**
   * Find client by email
   */
  async findClientByEmail(email: string): Promise<Client | null> {
    // Basic email validation
    const emailSchema = Joi.string().email().required();
    const { error } = emailSchema.validate(email);
    if (error) {
      throw new Error('Invalid email format');
    }

    return await this.clientRepository.findByEmail(email);
  }

  /**
   * Find client by access code
   */
  async findClientByAccessCode(accessCode: string): Promise<Client | null> {
    // Basic access code validation
    const accessCodeSchema = Joi.string().length(8).required();
    const { error } = accessCodeSchema.validate(accessCode);
    if (error) {
      throw new Error('Invalid access code format');
    }

    return await this.clientRepository.findByAccessCode(accessCode);
  }

  /**
   * Find client by ID
   */
  async findClientById(id: string): Promise<Client | null> {
    return await this.clientRepository.findById(id);
  }

  /**
   * Get all clients (for admin purposes)
   */
  async getAllClients(): Promise<Client[]> {
    return await this.clientRepository.findMany();
  }
}