import Joi from 'joi';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  JWT_SECRET: Joi.string().required(),
  
  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),
  
  // Miro Integration
  MIRO_CLIENT_ID: Joi.string().allow('').optional(),
  MIRO_CLIENT_SECRET: Joi.string().allow('').optional(),
  MIRO_REDIRECT_URI: Joi.string().allow('').optional(),
  MIRO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  
  // Todoist Integration
  TODOIST_API_TOKEN: Joi.string().allow('').optional(),
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: Joi.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  // Email
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export validated configuration
export const config = {
  database: {
    url: envVars.DATABASE_URL,
  },
  server: {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
    jwtSecret: envVars.JWT_SECRET,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
  },
  miro: {
    clientId: envVars.MIRO_CLIENT_ID,
    clientSecret: envVars.MIRO_CLIENT_SECRET,
    redirectUri: envVars.MIRO_REDIRECT_URI,
    accessToken: envVars.MIRO_ACCESS_TOKEN,
  },
  todoist: {
    apiToken: envVars.TODOIST_API_TOKEN,
  },
  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    allowedFileTypes: envVars.ALLOWED_FILE_TYPES.split(','),
  },
  email: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
};

export default config;