import { Router } from 'express';
import clientRoutes from './client.routes';
import webhookRoutes from './webhook.routes';
import projectRoutes from './projects.routes';

const router = Router();

// Mount client routes
router.use('/clients', clientRoutes);

// Mount webhook routes
router.use('/webhooks', webhookRoutes);

// Mount project routes
router.use('/projects', projectRoutes);

export default router;