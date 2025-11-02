// import { todoistService } from './todoist.service';
import { miroService } from './miro.service';
import { syncService } from './sync.service';

export interface ProjectCreationData {
  name: string;
  description?: string;
  clientId: string;
  designerId: string;
  serviceType: 'LOGO' | 'WEBSITE' | 'BRANDING';
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  brandInfo?: {
    colors?: string[];
    fonts?: string[];
    styleKeywords?: string[];
    logoUrl?: string;
  };
}

export interface ProjectIntegrationResult {
  success: boolean;
  projectId?: string;
  todoistProjectId?: string;
  miroBoardId?: string;
  error?: string;
}

/**
 * Service for integrating Supabase projects with Todoist and Miro
 */
export class SupabaseIntegrationService {
  
  /**
   * Create a complete project with Todoist and Miro integration
   */
  async createIntegratedProject(data: ProjectCreationData): Promise<ProjectIntegrationResult> {
    try {
      console.log(`Creating integrated project: ${data.name}`);

      // 1. Create project in Supabase
      const projectResult = await this.createSupabaseProject(data);
      if (!projectResult.success || !projectResult.projectId) {
        return { success: false, error: projectResult.error };
      }

      const projectId = projectResult.projectId;
      let todoistProjectId: string | undefined;
      let miroBoardId: string | undefined;

      // 2. Create Todoist project if service is available
      if (false) { // todoistService.isInitialized()
        try {
          // const todoistProject = await todoistService.createProject(
          //   `${data.name} - ${data.serviceType}`,
          //   this.getServiceTypeColor(data.serviceType)
          // );
          // todoistProjectId = todoistProject.id;

          // // Create tasks from template
          // await todoistService.createTasksFromTemplate(
          //   todoistProjectId,
          //   data.serviceType,
          //   data.startDate
          // );

          // Update Supabase project with Todoist ID
          await this.updateSupabaseProject(projectId, { todoistProjectId });

          console.log(`Todoist project created: ${todoistProjectId}`);
        } catch (todoistError) {
          console.error('Failed to create Todoist project:', todoistError);
          // Continue without Todoist integration
        }
      }

      // 3. Create Miro board if service is available
      if (miroService.isInitialized()) {
        try {
          // Create a mock ticket object for Miro integration
          const mockTicket = {
            id: projectId,
            ticketNumber: `PROJ-${Date.now()}`,
            title: data.name,
            description: data.description || '',
            serviceType: data.serviceType as any,
            priority: 'HIGH' as any,
            status: 'IN_PROGRESS' as any,
            deadline: data.endDate || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            clientId: data.clientId,
            miroBoardId: null,
            miroClientFrameId: null,
            miroDesignFrameId: null,
            miroReportFrameId: null,
            todoistProjectId: todoistProjectId || null,
          };

          miroBoardId = await miroService.createBoard(mockTicket);

          // Create board structure
          await miroService.createBoardStructure(
            mockTicket,
            miroBoardId,
            data.brandInfo
          );

          // Update Supabase project with Miro board ID
          await this.updateSupabaseProject(projectId, { miroBoardId });

          console.log(`Miro board created: ${miroBoardId}`);
        } catch (miroError) {
          console.error('Failed to create Miro board:', miroError);
          // Continue without Miro integration
        }
      }

      // 4. Create initial tasks in Supabase
      await this.createSupabaseTasks(projectId, data.serviceType, data.startDate);

      return {
        success: true,
        projectId,
        todoistProjectId,
        miroBoardId
      };

    } catch (error: any) {
      console.error('Error creating integrated project:', error);
      return {
        success: false,
        error: `Failed to create project: ${error.message}`
      };
    }
  }

  /**
   * Create project in Supabase
   */
  private async createSupabaseProject(data: ProjectCreationData): Promise<{
    success: boolean;
    projectId?: string;
    error?: string;
  }> {
    try {
      // Using Supabase MCP to create project
      const query = `
        INSERT INTO projects (
          id, name, description, "clientId", "designerId", 
          status, budget, "startDate", "endDate"
        ) VALUES (
          gen_random_uuid()::text,
          '${data.name.replace(/'/g, "''")}',
          ${data.description ? `'${data.description.replace(/'/g, "''")}'` : 'NULL'},
          '${data.clientId}',
          '${data.designerId}',
          'IN_PROGRESS',
          ${data.budget || 'NULL'},
          ${data.startDate ? `'${data.startDate.toISOString()}'` : 'NULL'},
          ${data.endDate ? `'${data.endDate.toISOString()}'` : 'NULL'}
        )
        RETURNING id;
      `;

      const result = await this.executeSupabaseQuery(query);
      
      if (result && result.length > 0) {
        return {
          success: true,
          projectId: result[0].id
        };
      } else {
        return {
          success: false,
          error: 'Failed to create project in database'
        };
      }
    } catch (error: any) {
      console.error('Error creating Supabase project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update project in Supabase
   */
  private async updateSupabaseProject(projectId: string, updates: {
    todoistProjectId?: string;
    miroBoardId?: string;
  }): Promise<void> {
    try {
      const updateFields: string[] = [];
      
      if (updates.todoistProjectId) {
        updateFields.push(`todoist_project_id = '${updates.todoistProjectId}'`);
      }
      
      if (updates.miroBoardId) {
        updateFields.push(`"miroBoardId" = '${updates.miroBoardId}'`);
      }

      if (updateFields.length === 0) return;

      const query = `
        UPDATE projects 
        SET ${updateFields.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = '${projectId}';
      `;

      await this.executeSupabaseQuery(query);
    } catch (error) {
      console.error('Error updating Supabase project:', error);
      throw error;
    }
  }

  /**
   * Create tasks in Supabase based on service type
   */
  private async createSupabaseTasks(
    projectId: string, 
    serviceType: 'LOGO' | 'WEBSITE' | 'BRANDING',
    startDate?: Date
  ): Promise<void> {
    try {
      const templates = this.getTaskTemplatesByServiceType(serviceType);
      const baseDate = startDate || new Date();

      for (const template of templates) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + template.daysOffset);

        const query = `
          INSERT INTO tasks (
            id, "projectId", title, description, status, priority, "dueDate"
          ) VALUES (
            gen_random_uuid()::text,
            '${projectId}',
            '${template.name.replace(/'/g, "''")}',
            'Tarefa ${template.order} do projeto ${serviceType.toLowerCase()}',
            'TODO',
            '${template.order <= 2 ? 'HIGH' : template.order <= 4 ? 'MEDIUM' : 'LOW'}',
            '${dueDate.toISOString()}'
          );
        `;

        await this.executeSupabaseQuery(query);
      }

      console.log(`Created ${templates.length} tasks for project ${projectId}`);
    } catch (error) {
      console.error('Error creating Supabase tasks:', error);
      throw error;
    }
  }

  /**
   * Sync task status between platforms
   */
  async syncTaskStatus(
    taskId: string,
    completed: boolean,
    source: 'supabase' | 'todoist' | 'miro'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Syncing task ${taskId} status: ${completed} from ${source}`);

      // Get task details from Supabase
      const taskQuery = `
        SELECT t.*, p."miroBoardId", p.todoist_project_id 
        FROM tasks t 
        JOIN projects p ON t."projectId" = p.id 
        WHERE t.id = '${taskId}';
      `;
      
      const taskResult = await this.executeSupabaseQuery(taskQuery);
      if (!taskResult || taskResult.length === 0) {
        return { success: false, error: 'Task not found' };
      }

      const task = taskResult[0];
      const newStatus = completed ? 'DONE' : 'TODO';

      // Update Supabase
      if (source !== 'supabase') {
        const updateQuery = `
          UPDATE tasks 
          SET status = '${newStatus}', "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = '${taskId}';
        `;
        await this.executeSupabaseQuery(updateQuery);
      }

      // Sync to Todoist
      if (false && source !== 'todoist') { // todoistService.isInitialized() && task.todoist_task_id
        try {
          // await todoistService.updateTaskStatus(task.todoist_task_id, completed);
        } catch (error) {
          console.warn('Failed to sync to Todoist:', error);
        }
      }

      // Sync to Miro
      if (source !== 'miro' && miroService.isInitialized() && task.miroBoardId && task.miro_widget_id) {
        try {
          await miroService.updateTaskStatus(
            task.miroBoardId,
            task.miro_widget_id,
            completed,
            task.title
          );
        } catch (error) {
          console.warn('Failed to sync to Miro:', error);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error syncing task status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get project with integration status
   */
  async getProjectIntegrationStatus(projectId: string): Promise<{
    project?: any;
    todoistStatus: 'connected' | 'disconnected' | 'error';
    miroStatus: 'connected' | 'disconnected' | 'error';
    syncStatus: 'healthy' | 'degraded' | 'error';
  }> {
    try {
      // Get project from Supabase
      const projectQuery = `
        SELECT * FROM projects WHERE id = '${projectId}';
      `;
      
      const projectResult = await this.executeSupabaseQuery(projectQuery);
      const project = projectResult && projectResult.length > 0 ? projectResult[0] : null;

      if (!project) {
        return {
          todoistStatus: 'disconnected',
          miroStatus: 'disconnected',
          syncStatus: 'error'
        };
      }

      // Check Todoist status
      let todoistStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
      // Todoist integration temporarily disabled
      // if (project.todoist_project_id && todoistService.isInitialized()) {
      //   try {
      //     await todoistService.getProject(project.todoist_project_id);
      //     todoistStatus = 'connected';
      //   } catch (error) {
      //     todoistStatus = 'error';
      //   }
      // }

      // Check Miro status
      let miroStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
      if (project.miroBoardId && miroService.isInitialized()) {
        try {
          await miroService.getBoardInfo(project.miroBoardId);
          miroStatus = 'connected';
        } catch (error) {
          miroStatus = 'error';
        }
      }

      // Check sync status
      const syncHealth = await syncService.healthCheck();
      const syncStatus = syncHealth.status === 'healthy' ? 'healthy' : 
                        syncHealth.status === 'degraded' ? 'degraded' : 'error';

      return {
        project,
        todoistStatus,
        miroStatus,
        syncStatus
      };
    } catch (error: any) {
      console.error('Error getting project integration status:', error);
      return {
        todoistStatus: 'error',
        miroStatus: 'error',
        syncStatus: 'error'
      };
    }
  }

  /**
   * Execute Supabase query using MCP
   */
  private async executeSupabaseQuery(query: string): Promise<any[]> {
    try {
      console.log('Executing Supabase query:', query);
      
      // Mock successful response for now
      // In a real implementation, this would use the Supabase MCP
      if (query.includes('INSERT INTO projects')) {
        return [{ id: `project-${Date.now()}` }];
      }
      
      return [];
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  }

  /**
   * Get service type color for Todoist
   */
  private getServiceTypeColor(serviceType: 'LOGO' | 'WEBSITE' | 'BRANDING'): string {
    const colors = {
      LOGO: 'red',
      WEBSITE: 'blue', 
      BRANDING: 'green'
    };
    return colors[serviceType] || 'blue';
  }

  /**
   * Get task templates by service type
   */
  private getTaskTemplatesByServiceType(serviceType: 'LOGO' | 'WEBSITE' | 'BRANDING'): Array<{
    name: string;
    order: number;
    daysOffset: number;
  }> {
    const templates = {
      LOGO: [
        { name: 'Análise do briefing', order: 1, daysOffset: 0 },
        { name: 'Pesquisa e moodboard', order: 2, daysOffset: 1 },
        { name: 'Conceitos iniciais (3 versões)', order: 3, daysOffset: 3 },
        { name: 'Revisão 1', order: 4, daysOffset: 5 },
        { name: 'Refinamento', order: 5, daysOffset: 7 },
        { name: 'Revisão final', order: 6, daysOffset: 9 },
        { name: 'Entrega de arquivos finais', order: 7, daysOffset: 10 }
      ],
      WEBSITE: [
        { name: 'Análise do briefing', order: 1, daysOffset: 0 },
        { name: 'Arquitetura de informação', order: 2, daysOffset: 2 },
        { name: 'Wireframes', order: 3, daysOffset: 5 },
        { name: 'Design de UI', order: 4, daysOffset: 10 },
        { name: 'Revisão do cliente', order: 5, daysOffset: 15 },
        { name: 'Ajustes finais', order: 6, daysOffset: 18 },
        { name: 'Entrega de arquivos', order: 7, daysOffset: 20 }
      ],
      BRANDING: [
        { name: 'Análise do briefing', order: 1, daysOffset: 0 },
        { name: 'Pesquisa de mercado', order: 2, daysOffset: 2 },
        { name: 'Estratégia de marca', order: 3, daysOffset: 5 },
        { name: 'Conceitos de identidade', order: 4, daysOffset: 8 },
        { name: 'Desenvolvimento do sistema', order: 5, daysOffset: 12 },
        { name: 'Manual de marca', order: 6, daysOffset: 16 },
        { name: 'Apresentação final', order: 7, daysOffset: 18 }
      ]
    };

    return templates[serviceType] || [];
  }

  /**
   * Health check for integration service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    supabase: string;
    todoist: string;
    miro: string;
    sync: string;
  }> {
    try {
      // Check Supabase
      let supabaseStatus = 'connected';
      try {
        await this.executeSupabaseQuery('SELECT 1;');
      } catch (error) {
        supabaseStatus = 'error';
      }

      // Check Todoist
      // const todoistHealth = await todoistService.healthCheck();
      const todoistStatus: 'ok' | 'error' | 'disconnected' = 'disconnected'; // todoistHealth.status;

      // Check Miro
      const miroHealth = await miroService.healthCheck();
      const miroStatus = miroHealth.status;

      // Check Sync
      const syncHealth = await syncService.healthCheck();
      const syncStatus = syncHealth.status;

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (supabaseStatus === 'error') {
        overallStatus = 'unhealthy';
      } else if (miroStatus === 'error' || syncStatus === 'unhealthy') {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        supabase: supabaseStatus,
        todoist: todoistStatus,
        miro: miroStatus,
        sync: syncStatus
      };
    } catch (error) {
      console.error('Error checking integration health:', error);
      return {
        status: 'unhealthy',
        supabase: 'error',
        todoist: 'error',
        miro: 'error',
        sync: 'error'
      };
    }
  }
}

// Export singleton instance
export const supabaseIntegrationService = new SupabaseIntegrationService();