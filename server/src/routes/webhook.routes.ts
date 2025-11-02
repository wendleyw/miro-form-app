import { Router, Request, Response } from 'express';
import { miroService, MiroWebhookEvent } from '../services/miro.service';
// import { todoistService, TodoistWebhookEvent } from '../services/todoist.service';
import { supabaseIntegrationService } from '../services/supabase-integration.service';
import { WebhookEventRepository } from '../services/webhook-event.repository';
import { TaskMappingRepository } from '../services/task-mapping.repository';
import { CommunicationLogRepository } from '../services/communication-log.repository';

const router = Router();
const webhookEventRepository = new WebhookEventRepository();
const taskMappingRepository = new TaskMappingRepository();
const communicationLogRepository = new CommunicationLogRepository();

/**
 * Miro webhook endpoint
 * Handles events from Miro boards
 */
router.post('/miro', async (req: Request, res: Response) => {
  try {
    console.log('Received Miro webhook:', req.body);

    // Validate webhook payload
    if (!req.body || !req.body.type || !req.body.data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload'
      });
    }

    const webhookEvent: MiroWebhookEvent = req.body;

    // Store webhook event for audit purposes (mock for now)
    console.log('Storing webhook event:', {
      source: 'MIRO',
      eventType: webhookEvent.type,
      processed: false,
    });

    // Process the webhook event
    await processMiroWebhookEvent(webhookEvent);

    // Mark as processed - we'll update by finding and updating individual records
    // since updateMany might not be available in the base repository
    console.log('Webhook event processed successfully');

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing Miro webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

/**
 * Process Miro webhook events
 */
async function processMiroWebhookEvent(event: MiroWebhookEvent): Promise<void> {
  try {
    console.log(`Processing Miro webhook event: ${event.type}`);

    switch (event.type) {
      case 'item_updated':
        await handleMiroItemUpdated(event);
        break;
      
      case 'item_created':
        await handleMiroItemCreated(event);
        break;
      
      case 'item_deleted':
        await handleMiroItemDeleted(event);
        break;
      
      default:
        console.log(`Unhandled Miro webhook event type: ${event.type}`);
    }

    // Process with Miro service
    if (miroService.isInitialized()) {
      await miroService.processWebhookEvent(event);
    }

  } catch (error) {
    console.error('Error processing Miro webhook event:', error);
    throw error;
  }
}

/**
 * Handle Miro item updated events
 */
async function handleMiroItemUpdated(event: MiroWebhookEvent): Promise<void> {
  try {
    const { item, board } = event.data;
    
    // Check if this is a task checkbox update
    if (item.type === 'shape' && item.data?.content) {
      const content = item.data.content;
      const isCompleted = content.includes('☑');
      const taskName = content.replace(/^[☐☑]\s*/, ''); // Remove checkbox symbol
      
      console.log(`Task checkbox updated: ${item.id}, completed: ${isCompleted}, task: ${taskName}`);
      console.log(`Board: ${board.id}`);
      
      // Mock task mapping processing
      console.log('Processing task update (mock mode)');
    }
    
    // Handle other item types if needed
    if (item.type === 'text' && item.data?.content) {
      // This could be a communication log update
      console.log(`Text item updated: ${item.id}`);
    }
    
  } catch (error) {
    console.error('Error handling Miro item updated:', error);
    throw error;
  }
}

/**
 * Handle Miro item created events
 */
async function handleMiroItemCreated(event: MiroWebhookEvent): Promise<void> {
  try {
    const { item, board } = event.data;
    
    console.log(`New item created in Miro board ${board.id}: ${item.type} (${item.id})`);
    
    // Handle new items if needed
    // For example, if a designer adds a new comment or sticky note
    if (item.type === 'sticky_note' && item.data?.content) {
      // This could be treated as a communication entry
      console.log(`New sticky note created: ${item.data.content}`);
    }
    
  } catch (error) {
    console.error('Error handling Miro item created:', error);
    throw error;
  }
}

/**
 * Handle Miro item deleted events
 */
async function handleMiroItemDeleted(event: MiroWebhookEvent): Promise<void> {
  try {
    const { item, board } = event.data;
    
    console.log(`Item deleted from Miro board ${board.id}: ${item.type} (${item.id})`);
    
    // Handle item deletion if needed
    // For example, if a task checkbox is deleted, we might want to log it
    
  } catch (error) {
    console.error('Error handling Miro item deleted:', error);
    throw error;
  }
}

/**
 * Todoist webhook endpoint
 */
router.post('/todoist', async (req: Request, res: Response) => {
  try {
    console.log('Received Todoist webhook:', req.body);

    // Validate webhook payload
    if (!req.body || !req.body.event_name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Todoist webhook payload'
      });
    }

    // Store webhook event for audit purposes (mock for now)
    console.log('Storing webhook event:', {
      source: 'TODOIST',
      eventType: req.body.event_name || 'unknown',
      processed: false,
    });

    // Process Todoist webhook events
    await processTodoistWebhookEvent(req.body);

    return res.status(200).json({
      success: true,
      message: 'Todoist webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing Todoist webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

/**
 * Health check endpoint for webhooks
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Webhook service is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get webhook events (for debugging)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { source, limit = 50, offset = 0 } = req.query;
    
    const whereClause: any = {};
    if (source) {
      whereClause.source = source;
    }
    
    const events = await webhookEventRepository.findMany(whereClause);
    
    const total = await webhookEventRepository.count(whereClause);
    
    return res.status(200).json({
      success: true,
      events,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
    
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook events'
    });
  }
});

/**
 * Process Todoist webhook events
 */
async function processTodoistWebhookEvent(event: any): Promise<void> {
  try {
    console.log(`Processing Todoist webhook event: ${event.event_name}`);

    switch (event.event_name) {
      case 'item:completed':
        await handleTodoistTaskCompleted(event);
        break;
      
      case 'item:uncompleted':
        await handleTodoistTaskUncompleted(event);
        break;
      
      case 'item:updated':
        await handleTodoistTaskUpdated(event);
        break;
      
      case 'note:added':
        await handleTodoistCommentAdded(event);
        break;
      
      default:
        console.log(`Unhandled Todoist webhook event type: ${event.event_name}`);
    }

    // Process with Todoist service
    // if (todoistService.isInitialized()) {
    //   await todoistService.processWebhookEvent(event);
    // }

  } catch (error) {
    console.error('Error processing Todoist webhook event:', error);
    throw error;
  }
}

/**
 * Handle Todoist task completion events
 */
async function handleTodoistTaskCompleted(event: any): Promise<void> {
  try {
    const taskId = event.event_data.id;
    console.log(`Todoist task completed: ${taskId}`);
    
    // Sync task status to other platforms
    await supabaseIntegrationService.syncTaskStatus(taskId, true, 'todoist');
    
  } catch (error) {
    console.error('Error handling Todoist task completed:', error);
    throw error;
  }
}

/**
 * Handle Todoist task uncompleted events
 */
async function handleTodoistTaskUncompleted(event: any): Promise<void> {
  try {
    const taskId = event.event_data.id;
    console.log(`Todoist task uncompleted: ${taskId}`);
    
    // Sync task status to other platforms
    await supabaseIntegrationService.syncTaskStatus(taskId, false, 'todoist');
    
  } catch (error) {
    console.error('Error handling Todoist task uncompleted:', error);
    throw error;
  }
}

/**
 * Handle Todoist task updated events
 */
async function handleTodoistTaskUpdated(event: any): Promise<void> {
  try {
    const taskId = event.event_data.id;
    console.log(`Todoist task updated: ${taskId}`);
    
    // Handle task updates (priority, due date, etc.)
    // This could trigger sync operations if needed
    
  } catch (error) {
    console.error('Error handling Todoist task updated:', error);
    throw error;
  }
}

/**
 * Handle Todoist comment added events
 */
async function handleTodoistCommentAdded(event: any): Promise<void> {
  try {
    const taskId = event.event_data.id;
    console.log(`Todoist comment added to task: ${taskId}`);
    
    // This could sync comments to Miro or Supabase
    
  } catch (error) {
    console.error('Error handling Todoist comment added:', error);
    throw error;
  }
}

export default router;