import { Router, Request, Response } from 'express';
import { supabaseIntegrationService } from '../services/supabase-integration.service';
// import { todoistService } from '../services/todoist.service';
import { miroService } from '../services/miro.service';

const router = Router();

/**
 * Get all projects from Supabase
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // For now, return available endpoints since we don't have a direct way to list projects
    return res.status(200).json({
      success: true,
      message: 'Projects API is available',
      availableEndpoints: [
        'GET /api/projects - List available endpoints',
        'POST /api/projects - Create new project',
        'POST /api/projects/test - Create test project',
        'GET /api/projects/health - System health check',
        'GET /api/projects/:id/status - Get project status',
        'GET /api/projects/:id/tasks - Get project tasks',
        'PATCH /api/projects/:id/tasks/:taskId/sync - Sync task status',
        'GET /api/projects/:id/todoist/stats - Get Todoist statistics',
        'GET /api/projects/:id/miro/info - Get Miro board info'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in projects GET:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get projects'
    });
  }
});

/**
 * Create a new integrated project
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      clientId,
      designerId,
      serviceType,
      budget,
      startDate,
      endDate,
      brandInfo
    } = req.body;

    // Validate required fields
    if (!name || !clientId || !designerId || !serviceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, clientId, designerId, serviceType'
      });
    }

    // Validate service type
    if (!['LOGO', 'WEBSITE', 'BRANDING'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service type. Must be LOGO, WEBSITE, or BRANDING'
      });
    }

    const projectData = {
      name,
      description,
      clientId,
      designerId,
      serviceType,
      budget: budget ? parseFloat(budget) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      brandInfo
    };

    const result = await supabaseIntegrationService.createIntegratedProject(projectData);

    if (result.success) {
      return res.status(201).json({
        success: true,
        project: {
          id: result.projectId,
          todoistProjectId: result.todoistProjectId,
          miroBoardId: result.miroBoardId,
          miroBoardUrl: result.miroBoardId ? `https://miro.com/app/board/${result.miroBoardId}/` : undefined
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error: any) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

/**
 * Get project integration status
 */
router.get('/:projectId/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const status = await supabaseIntegrationService.getProjectIntegrationStatus(projectId);

    return res.status(200).json({
      success: true,
      status
    });

  } catch (error: any) {
    console.error('Error getting project status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get project status'
    });
  }
});

/**
 * Sync task status manually
 */
router.patch('/:projectId/tasks/:taskId/sync', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { completed, source = 'manual' } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'completed field must be a boolean'
      });
    }

    const result = await supabaseIntegrationService.syncTaskStatus(
      taskId,
      completed,
      source
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Task status synced successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error: any) {
    console.error('Error syncing task status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync task status'
    });
  }
});

/**
 * Get Todoist project statistics
 */
router.get('/:projectId/todoist/stats', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get project to find Todoist project ID
    const status = await supabaseIntegrationService.getProjectIntegrationStatus(projectId);
    
    if (!status.project?.todoist_project_id) {
      return res.status(404).json({
        success: false,
        error: 'Todoist project not found'
      });
    }

    if (true) { // !todoistService.isInitialized()
      return res.status(503).json({
        success: false,
        error: 'Todoist service not available'
      });
    }

    // const stats = await todoistService.getProjectStatistics(status.project.todoist_project_id);
    const stats = { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0 };

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Error getting Todoist stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get Todoist statistics'
    });
  }
});

/**
 * Get Miro board info
 */
router.get('/:projectId/miro/info', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get project to find Miro board ID
    const status = await supabaseIntegrationService.getProjectIntegrationStatus(projectId);
    
    if (!status.project?.miroBoardId) {
      return res.status(404).json({
        success: false,
        error: 'Miro board not found'
      });
    }

    if (!miroService.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Miro service not available'
      });
    }

    const boardInfo = await miroService.getBoardInfo(status.project.miroBoardId);

    return res.status(200).json({
      success: true,
      boardInfo,
      boardUrl: `https://miro.com/app/board/${status.project.miroBoardId}/`
    });

  } catch (error: any) {
    console.error('Error getting Miro board info:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get Miro board info'
    });
  }
});

/**
 * Health check for all integrations
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await supabaseIntegrationService.healthCheck();

    return res.status(200).json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error checking integration health:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check health'
    });
  }
});

/**
 * Test endpoint for creating a sample project
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    // Create a test project with sample data
    const testProjectData = {
      name: `Test Project - ${Date.now()}`,
      description: 'This is a test project created via API',
      clientId: 'test-client-id',
      designerId: 'test-designer-id',
      serviceType: 'LOGO' as const,
      budget: 5000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      brandInfo: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        fonts: ['Montserrat', 'Open Sans'],
        styleKeywords: ['modern', 'clean', 'professional']
      }
    };

    const result = await supabaseIntegrationService.createIntegratedProject(testProjectData);

    return res.status(201).json({
      success: true,
      message: 'Test project created successfully',
      result
    });

  } catch (error: any) {
    console.error('Error creating test project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create test project'
    });
  }
});

export default router;