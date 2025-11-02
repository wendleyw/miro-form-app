import { miroService } from './miro.service';
import { TaskMappingRepository } from './task-mapping.repository';
import { CommunicationLogRepository } from './communication-log.repository';
import { TicketRepository } from './ticket.repository';

export interface SyncEvent {
  type: 'task_updated' | 'communication_added' | 'status_changed';
  source: 'miro' | 'todoist' | 'system';
  ticketId: string;
  data: any;
  timestamp: Date;
}

export interface TaskSyncData {
  taskMappingId: string;
  completed: boolean;
  taskName: string;
  source: 'miro' | 'todoist';
}

export interface CommunicationSyncData {
  ticketId: string;
  message: string;
  author: string;
  source: 'miro' | 'todoist' | 'client';
}

/**
 * Service for synchronizing data between Miro and Todoist
 */
export class SyncService {
  private taskMappingRepository: TaskMappingRepository;
  private communicationLogRepository: CommunicationLogRepository;
  private ticketRepository: TicketRepository;

  constructor(
    taskMappingRepository?: TaskMappingRepository,
    communicationLogRepository?: CommunicationLogRepository,
    ticketRepository?: TicketRepository
  ) {
    this.taskMappingRepository = taskMappingRepository || new TaskMappingRepository();
    this.communicationLogRepository = communicationLogRepository || new CommunicationLogRepository();
    this.ticketRepository = ticketRepository || new TicketRepository();
  }

  /**
   * Sync task completion status between Miro and Todoist
   */
  async syncTaskCompletion(data: TaskSyncData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`Syncing task completion: ${data.taskMappingId} -> ${data.completed} (from ${data.source})`);

      // Get task mapping details
      const taskMapping = await this.taskMappingRepository.findById(data.taskMappingId);
      if (!taskMapping) {
        return { success: false, error: 'Task mapping not found' };
      }

      // Get ticket details
      const ticket = await this.ticketRepository.findById(taskMapping.ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Update task mapping
      await this.taskMappingRepository.update(data.taskMappingId, {
        completed: data.completed,
        syncedAt: new Date(),
      });

      // Sync to the opposite platform
      if (data.source === 'miro') {
        // Update Todoist task
        await this.syncToTodoist(taskMapping, data.completed, data.taskName);
      } else if (data.source === 'todoist') {
        // Update Miro checkbox
        await this.syncToMiro(ticket, taskMapping, data.completed, data.taskName);
      }

      // Add communication log
      await this.communicationLogRepository.create({
        ticket: { connect: { id: taskMapping.ticketId } },
        authorType: 'SYSTEM',
        authorName: 'Sync Service',
        message: `Task ${data.completed ? 'completed' : 'reopened'}: ${data.taskName} (synced from ${data.source})`,
      });

      console.log(`Task sync completed successfully for ${data.taskMappingId}`);
      return { success: true };

    } catch (error) {
      console.error('Error syncing task completion:', error);
      return { 
        success: false, 
        error: `Sync failed: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Sync task status to Todoist
   */
  private async syncToTodoist(
    taskMapping: any, 
    completed: boolean, 
    taskName: string
  ): Promise<void> {
    try {
      // TODO: Implement Todoist sync when Todoist integration is ready
      console.log(`Would sync to Todoist: task ${taskMapping.todoistTaskId} -> ${completed}`);
      
      // Placeholder for Todoist API call
      // await todoistService.updateTaskStatus(taskMapping.todoistTaskId, completed);
      
    } catch (error) {
      console.error('Error syncing to Todoist:', error);
      throw error;
    }
  }

  /**
   * Sync task status to Miro
   */
  private async syncToMiro(
    ticket: any,
    taskMapping: any, 
    completed: boolean, 
    taskName: string
  ): Promise<void> {
    try {
      if (!miroService.isInitialized() || !ticket.miroBoardId || !taskMapping.miroWidgetId) {
        console.log('Miro sync skipped: service not initialized or missing board/widget IDs');
        return;
      }

      await miroService.updateTaskStatus(
        ticket.miroBoardId,
        taskMapping.miroWidgetId,
        completed,
        taskName
      );

      console.log(`Synced task status to Miro: ${taskMapping.miroWidgetId} -> ${completed}`);
      
    } catch (error) {
      console.error('Error syncing to Miro:', error);
      throw error;
    }
  }

  /**
   * Sync communication between platforms
   */
  async syncCommunication(data: CommunicationSyncData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`Syncing communication: ${data.ticketId} from ${data.source}`);

      // Get ticket details
      const ticket = await this.ticketRepository.findById(data.ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Add to communication log
      await this.communicationLogRepository.create({
        ticket: { connect: { id: data.ticketId } },
        authorType: data.source === 'client' ? 'CLIENT' : 'DESIGNER',
        authorName: data.author,
        message: data.message,
      });

      // Sync to other platforms
      if (data.source !== 'miro' && miroService.isInitialized() && ticket.miroBoardId && ticket.miroReportFrameId) {
        await miroService.addCommunicationEntry(
          ticket.miroBoardId,
          ticket.miroReportFrameId,
          data.message,
          data.author,
          new Date()
        );
      }

      // TODO: Sync to Todoist comments when Todoist integration is ready
      if (data.source !== 'todoist') {
        console.log(`Would sync communication to Todoist: ${data.message}`);
      }

      console.log(`Communication sync completed for ticket ${data.ticketId}`);
      return { success: true };

    } catch (error) {
      console.error('Error syncing communication:', error);
      return { 
        success: false, 
        error: `Communication sync failed: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Sync ticket status changes
   */
  async syncTicketStatus(
    ticketId: string, 
    newStatus: string, 
    source: 'miro' | 'todoist' | 'system'
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`Syncing ticket status: ${ticketId} -> ${newStatus} (from ${source})`);

      // Get ticket details
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Update ticket status if different
      if (ticket.status !== newStatus) {
        await this.ticketRepository.update(ticketId, {
          status: newStatus as any,
          updatedAt: new Date(),
        });
      }

      // Sync status to other platforms
      if (source !== 'miro' && miroService.isInitialized() && ticket.miroBoardId && ticket.miroReportFrameId) {
        await miroService.addCommunicationEntry(
          ticket.miroBoardId,
          ticket.miroReportFrameId,
          `Ticket status changed to: ${newStatus}`,
          'System',
          new Date()
        );
      }

      // TODO: Sync to Todoist project when integration is ready
      if (source !== 'todoist') {
        console.log(`Would sync status to Todoist: ${newStatus}`);
      }

      console.log(`Ticket status sync completed for ${ticketId}`);
      return { success: true };

    } catch (error) {
      console.error('Error syncing ticket status:', error);
      return { 
        success: false, 
        error: `Status sync failed: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Handle conflict resolution when simultaneous updates occur
   */
  async resolveConflict(
    taskMappingId: string,
    miroUpdate: { completed: boolean; timestamp: Date },
    todoistUpdate: { completed: boolean; timestamp: Date }
  ): Promise<{
    success: boolean;
    resolution: 'miro_wins' | 'todoist_wins' | 'no_conflict';
    error?: string;
  }> {
    try {
      console.log(`Resolving conflict for task ${taskMappingId}`);

      // Use last-write-wins strategy
      const miroWins = miroUpdate.timestamp > todoistUpdate.timestamp;
      const resolution = miroWins ? 'miro_wins' : 'todoist_wins';

      if (miroUpdate.completed === todoistUpdate.completed) {
        return { success: true, resolution: 'no_conflict' };
      }

      // Apply the winning update
      const winningUpdate = miroWins ? miroUpdate : todoistUpdate;
      const winningSource = miroWins ? 'miro' : 'todoist';

      await this.syncTaskCompletion({
        taskMappingId,
        completed: winningUpdate.completed,
        taskName: 'Conflict Resolution',
        source: winningSource,
      });

      // Log the conflict resolution
      const taskMapping = await this.taskMappingRepository.findById(taskMappingId);
      if (taskMapping) {
        await this.communicationLogRepository.create({
          ticket: { connect: { id: taskMapping.ticketId } },
          authorType: 'SYSTEM',
          authorName: 'Sync Service',
          message: `Conflict resolved: ${resolution} (${winningSource} update at ${winningUpdate.timestamp.toISOString()})`,
        });
      }

      console.log(`Conflict resolved: ${resolution}`);
      return { success: true, resolution };

    } catch (error) {
      console.error('Error resolving conflict:', error);
      return { 
        success: false, 
        resolution: 'no_conflict',
        error: `Conflict resolution failed: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Get sync statistics for a ticket
   */
  async getSyncStatistics(ticketId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    lastSyncTime: Date | null;
    syncErrors: number;
  }> {
    try {
      const taskMappings = await this.taskMappingRepository.findMany({ ticketId });
      
      const totalTasks = taskMappings.length;
      const completedTasks = taskMappings.filter(task => task.completed).length;
      
      // Find the most recent sync time
      const lastSyncTime = taskMappings.reduce((latest, task) => {
        if (!task.syncedAt) return latest;
        if (!latest || task.syncedAt > latest) return task.syncedAt;
        return latest;
      }, null as Date | null);

      // TODO: Count sync errors from audit logs
      const syncErrors = 0;

      return {
        totalTasks,
        completedTasks,
        lastSyncTime,
        syncErrors
      };

    } catch (error) {
      console.error('Error getting sync statistics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        lastSyncTime: null,
        syncErrors: 1
      };
    }
  }

  /**
   * Health check for sync service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    miroStatus: string;
    todoistStatus: string;
    lastSyncTime: Date | null;
  }> {
    try {
      const miroStatus = miroService.isInitialized() ? 'connected' : 'disconnected';
      const todoistStatus = 'not_implemented'; // Will be updated when Todoist integration is ready
      
      // Get the most recent sync time across all tickets
      const recentTaskMappings = await this.taskMappingRepository.findMany({});
      
      // Find the most recent sync time
      const lastSyncTime = recentTaskMappings.reduce((latest, task) => {
        if (!task.syncedAt) return latest;
        if (!latest || task.syncedAt > latest) return task.syncedAt;
        return latest;
      }, null as Date | null);
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!miroService.isInitialized()) {
        status = 'degraded';
      }
      
      // If no syncs in the last hour and there are active tickets, mark as degraded
      if (lastSyncTime && (Date.now() - lastSyncTime.getTime()) > 3600000) {
        status = 'degraded';
      }

      return {
        status,
        miroStatus,
        todoistStatus,
        lastSyncTime
      };

    } catch (error) {
      console.error('Error checking sync service health:', error);
      return {
        status: 'unhealthy',
        miroStatus: 'error',
        todoistStatus: 'error',
        lastSyncTime: null
      };
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();