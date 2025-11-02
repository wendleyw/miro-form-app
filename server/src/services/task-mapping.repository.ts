import { TaskMapping, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type TaskMappingCreateInput = Prisma.TaskMappingCreateInput;
export type TaskMappingUpdateInput = Prisma.TaskMappingUpdateInput;
export type TaskMappingWhereInput = Prisma.TaskMappingWhereInput;

/**
 * Repository for TaskMapping entity operations
 */
export class TaskMappingRepository extends BaseRepository<
  TaskMapping,
  TaskMappingCreateInput,
  TaskMappingUpdateInput,
  TaskMappingWhereInput
> {
  async create(data: TaskMappingCreateInput): Promise<TaskMapping> {
    try {
      return await this.prisma.taskMapping.create({
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.create');
    }
  }

  async findById(id: string): Promise<TaskMapping | null> {
    try {
      return await this.prisma.taskMapping.findUnique({
        where: { id },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.findById');
    }
  }

  async findMany(where?: TaskMappingWhereInput): Promise<TaskMapping[]> {
    try {
      return await this.prisma.taskMapping.findMany({
        where,
        include: {
          ticket: true,
        },
        orderBy: { taskOrder: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.findMany');
    }
  }

  async findByTicketId(ticketId: string): Promise<TaskMapping[]> {
    try {
      return await this.prisma.taskMapping.findMany({
        where: { ticketId },
        orderBy: { taskOrder: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.findByTicketId');
    }
  }

  async findByTodoistTaskId(todoistTaskId: string): Promise<TaskMapping | null> {
    try {
      return await this.prisma.taskMapping.findFirst({
        where: { todoistTaskId },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.findByTodoistTaskId');
    }
  }

  async findByMiroWidgetId(miroWidgetId: string): Promise<TaskMapping | null> {
    try {
      return await this.prisma.taskMapping.findFirst({
        where: { miroWidgetId },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.findByMiroWidgetId');
    }
  }

  async update(id: string, data: TaskMappingUpdateInput): Promise<TaskMapping> {
    try {
      return await this.prisma.taskMapping.update({
        where: { id },
        data: {
          ...data,
          syncedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.update');
    }
  }

  async delete(id: string): Promise<TaskMapping> {
    try {
      return await this.prisma.taskMapping.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.delete');
    }
  }

  async count(where?: TaskMappingWhereInput): Promise<number> {
    try {
      return await this.prisma.taskMapping.count({ where });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.count');
    }
  }

  /**
   * Update task completion status and sync timestamp
   */
  async updateCompletion(id: string, completed: boolean): Promise<TaskMapping> {
    try {
      return await this.prisma.taskMapping.update({
        where: { id },
        data: {
          completed,
          syncedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.updateCompletion');
    }
  }

  /**
   * Bulk create task mappings for a ticket
   */
  async createMany(data: Prisma.TaskMappingCreateManyInput[]): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.taskMapping.createMany({
        data,
      });
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.createMany');
    }
  }

  /**
   * Get task completion progress for a ticket
   */
  async getTicketProgress(ticketId: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    try {
      const [total, completed] = await Promise.all([
        this.prisma.taskMapping.count({
          where: { ticketId },
        }),
        this.prisma.taskMapping.count({
          where: { ticketId, completed: true },
        }),
      ]);

      return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    } catch (error) {
      this.handleError(error, 'TaskMappingRepository.getTicketProgress');
    }
  }
}