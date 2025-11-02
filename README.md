# Ticket Management System

An integrated platform that enables clients to submit design work requests through a web application, automatically generates organized project structures in Miro for creative work, and synchronizes tasks with Todoist for project management.

## Project Structure

```
ticket-management-system/
├── client/          # Next.js frontend application
├── server/          # Express.js backend API
├── .kiro/           # Kiro specifications and configuration
└── package.json     # Root workspace configuration
```

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis server
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env with your configuration:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Secret key for JWT tokens
# - REDIS_HOST/PORT: Redis server configuration
# - MIRO_CLIENT_ID/SECRET: Miro app credentials
# - TODOIST_API_TOKEN: Todoist API token
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Start Development Servers

```bash
# Start both client and server in development mode
npm run dev

# Or start individually:
npm run dev:server  # Backend on http://localhost:3001
npm run dev:client  # Frontend on http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start both applications in production mode
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and run migrations

## Technology Stack

### Frontend (Client)
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- React Hook Form for form management
- TanStack Query for data fetching
- Zustand for state management

### Backend (Server)
- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Bull Queue with Redis for job processing
- JWT for authentication

### Integrations
- Miro SDK for board management
- Todoist API via MCP server
- Webhook endpoints for real-time sync

## Development Workflow

1. **Requirements**: Defined in `.kiro/specs/ticket-management-system/requirements.md`
2. **Design**: Documented in `.kiro/specs/ticket-management-system/design.md`
3. **Tasks**: Implementation plan in `.kiro/specs/ticket-management-system/tasks.md`

## Next Steps

After completing the project setup, continue with the implementation tasks:

1. Implement database models and core data layer
2. Build authentication and client management system
3. Develop core ticket management service
4. Implement Miro integration service
5. Create Todoist MCP server integration
6. Develop bidirectional synchronization engine
7. Build client portal frontend
8. Create API endpoints and routing
9. Integrate all components and implement end-to-end flows

## Support

For development questions and issues, refer to the specification documents in the `.kiro/specs/` directory.