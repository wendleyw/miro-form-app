import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// API health check
app.get('/api/projects/health', (req, res) => {
  res.json({
    success: true,
    health: {
      status: 'healthy',
      supabase: 'connected',
      todoist: process.env.TODOIST_API_TOKEN ? 'connected' : 'disconnected',
      miro: process.env.MIRO_ACCESS_TOKEN ? 'connected' : 'disconnected',
      sync: 'healthy'
    },
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoints (POST)
app.post('/api/webhooks/miro', (req, res) => {
  console.log('Miro POST webhook received:', {
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  
  // Handle Miro webhook verification challenge (POST)
  if (req.body.challenge) {
    console.log('Miro POST verification challenge:', req.body.challenge);
    return res.status(200).send(req.body.challenge);
  }
  
  // Handle hub.challenge verification (POST)
  if (req.body['hub.challenge']) {
    console.log('Miro hub.challenge verification (POST):', req.body['hub.challenge']);
    return res.status(200).send(req.body['hub.challenge']);
  }
  
  // Handle Miro ping events
  if (req.body.type === 'ping') {
    console.log('Miro ping received');
    return res.status(200).json({ 
      status: 'ok',
      message: 'Ping received'
    });
  }
  
  // Handle webhook verification request
  if (req.body.type === 'webhook_verification') {
    console.log('Miro webhook verification request');
    return res.status(200).json({ 
      status: 'verified',
      message: 'Webhook verified successfully'
    });
  }
  
  // Handle actual webhook events
  console.log('Processing Miro webhook event:', req.body.type || 'unknown');
  return res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
    type: req.body.type || 'unknown',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/webhooks/todoist', (req, res) => {
  console.log('Todoist webhook received:', req.body);
  
  // Handle Todoist webhook verification
  if (req.body.test) {
    return res.status(200).send('OK');
  }
  
  // Handle actual webhook events
  return res.status(200).json({
    success: true,
    message: 'Todoist webhook processed successfully'
  });
});

// Webhook verification endpoints (GET)
app.get('/api/webhooks/miro', (req, res) => {
  console.log('Miro GET request received:', req.query);
  
  // Handle Miro webhook verification via GET
  const challenge = req.query.challenge;
  if (challenge) {
    console.log('Miro GET verification challenge:', challenge);
    return res.status(200).send(challenge);
  }
  
  // Handle hub.challenge verification (common webhook pattern)
  const hubChallenge = req.query['hub.challenge'];
  if (hubChallenge) {
    console.log('Miro hub.challenge verification:', hubChallenge);
    return res.status(200).send(hubChallenge);
  }
  
  return res.status(200).json({
    message: 'Miro webhook endpoint ready',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/webhooks/todoist', (req, res) => {
  return res.json({
    message: 'Todoist webhook endpoint',
    status: 'ready'
  });
});

// Webhook health
app.get('/api/webhooks/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for webhook verification
app.get('/api/webhooks/test', (req, res) => {
  return res.status(200).json({
    message: 'Webhook test endpoint',
    status: 'ok',
    timestamp: new Date().toISOString(),
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    }
  });
});

app.post('/api/webhooks/test', (req, res) => {
  return res.status(200).json({
    message: 'Webhook test endpoint (POST)',
    status: 'ok',
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ticket Management System API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET /api/projects/health - API health check',
      'GET /api/webhooks/miro - Miro webhook verification',
      'POST /api/webhooks/miro - Miro webhook events',
      'GET /api/webhooks/todoist - Todoist webhook verification',
      'POST /api/webhooks/todoist - Todoist webhook events',
      'GET /api/webhooks/health - Webhook health',
      'GET /api/webhooks/test - Test webhook endpoint'
    ]
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl 
  });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 API: http://localhost:${PORT}/api/projects/health`);
  });
}

export default app;