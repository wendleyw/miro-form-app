import { ServiceType, Priority, TicketStatus, Attachment } from '@prisma/client';
import { TicketRepository, TicketWithRelations } from './ticket.repository';
import { BrandInfoRepository } from './brand-info.repository';
import { AttachmentRepository } from './attachment.repository';
import { CommunicationLogRepository } from './communication-log.repository';
import { miroService, MiroBoardStructure } from './miro.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

export interface TicketSubmissionData {
  clientId: string;
  title: string;
  description?: string;
  serviceType: ServiceType;
  priority?: Priority;
  deadline?: Date;
  brandInfo?: {
    colors?: string[];
    fonts?: string[];
    styleKeywords?: string[];
    logoUrl?: string;
  };
}

export interface TicketValidationError {
  field: string;
  message: string;
}

export interface TicketCreationResponse {
  success: boolean;
  ticket?: TicketWithRelations;
  errors?: TicketValidationError[];
  miroBoardId?: string;
  miroBoardUrl?: string;
}

export interface TicketStatusUpdateData {
  status: TicketStatus;
  authorName?: string;
  comment?: string;
}

export interface FileUploadData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface AttachmentUploadResponse {
  success: boolean;
  attachment?: Attachment;
  error?: string;
}

/**
 * Service class for ticket management operations
 * Handles validation, creation, and lifecycle management
 */
export class TicketService {
  private ticketRepository: TicketRepository;
  private brandInfoRepository: BrandInfoRepository;
  private attachmentRepository: AttachmentRepository;
  private communicationLogRepository: CommunicationLogRepository;

  constructor(
    ticketRepository?: TicketRepository,
    brandInfoRepository?: BrandInfoRepository,
    attachmentRepository?: AttachmentRepository,
    communicationLogRepository?: CommunicationLogRepository
  ) {
    this.ticketRepository = ticketRepository || new TicketRepository();
    this.brandInfoRepository = brandInfoRepository || new BrandInfoRepository();
    this.attachmentRepository = attachmentRepository || new AttachmentRepository();
    this.communicationLogRepository = communicationLogRepository || new CommunicationLogRepository();
  }

  /**
   * Validate ticket submission data
   */
  private validateTicketSubmission(data: TicketSubmissionData): TicketValidationError[] {
    const errors: TicketValidationError[] = [];

    // Required field validation
    if (!data.clientId || data.clientId.trim() === '') {
      errors.push({ field: 'clientId', message: 'Client ID is required' });
    }

    if (!data.title || data.title.trim() === '') {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (data.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must be 255 characters or less' });
    }

    // Service type validation
    if (!data.serviceType) {
      errors.push({ field: 'serviceType', message: 'Service type is required' });
    } else if (!Object.values(ServiceType).includes(data.serviceType)) {
      errors.push({ 
        field: 'serviceType', 
        message: `Service type must be one of: ${Object.values(ServiceType).join(', ')}` 
      });
    }

    // Priority validation (optional, defaults to NORMAL)
    if (data.priority && !Object.values(Priority).includes(data.priority)) {
      errors.push({ 
        field: 'priority', 
        message: `Priority must be one of: ${Object.values(Priority).join(', ')}` 
      });
    }

    // Deadline validation
    if (data.deadline) {
      const now = new Date();
      if (data.deadline <= now) {
        errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
      }
    }

    // Description length validation
    if (data.description && data.description.length > 5000) {
      errors.push({ field: 'description', message: 'Description must be 5000 characters or less' });
    }

    // Brand info validation
    if (data.brandInfo) {
      if (data.brandInfo.colors && data.brandInfo.colors.length > 10) {
        errors.push({ field: 'brandInfo.colors', message: 'Maximum 10 colors allowed' });
      }

      if (data.brandInfo.fonts && data.brandInfo.fonts.length > 5) {
        errors.push({ field: 'brandInfo.fonts', message: 'Maximum 5 fonts allowed' });
      }

      if (data.brandInfo.styleKeywords && data.brandInfo.styleKeywords.length > 20) {
        errors.push({ field: 'brandInfo.styleKeywords', message: 'Maximum 20 style keywords allowed' });
      }

      // Validate color format (hex colors)
      if (data.brandInfo.colors) {
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        data.brandInfo.colors.forEach((color, index) => {
          if (!hexColorRegex.test(color)) {
            errors.push({ 
              field: `brandInfo.colors[${index}]`, 
              message: 'Colors must be in hex format (e.g., #FF0000)' 
            });
          }
        });
      }
    }

    return errors;
  }

  /**
   * Generate unique ticket number in TICK-YYYY-NNN format
   */
  async generateTicketNumber(): Promise<string> {
    return await this.ticketRepository.generateTicketNumber();
  }

  /**
   * Create a new ticket with validation
   */
  async createTicket(data: TicketSubmissionData): Promise<TicketCreationResponse> {
    try {
      // Validate input data
      const validationErrors = this.validateTicketSubmission(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // Generate unique ticket number
      const ticketNumber = await this.generateTicketNumber();

      // Create ticket with transaction to ensure data consistency
      const ticket = await this.ticketRepository.withTransaction(async (tx) => {
        // Create the ticket
        const newTicket = await tx.ticket.create({
          data: {
            ticketNumber,
            clientId: data.clientId,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            serviceType: data.serviceType,
            priority: data.priority || Priority.NORMAL,
            status: TicketStatus.PENDING,
            deadline: data.deadline || null,
          },
          include: {
            client: true,
            taskMappings: true,
            brandInfo: true,
            attachments: true,
            communicationLogs: {
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        // Create brand info if provided
        if (data.brandInfo && Object.keys(data.brandInfo).length > 0) {
          await tx.brandInfo.create({
            data: {
              ticketId: newTicket.id,
              colors: data.brandInfo.colors || [],
              fonts: data.brandInfo.fonts || [],
              styleKeywords: data.brandInfo.styleKeywords || [],
              logoUrl: data.brandInfo.logoUrl || null,
            }
          });
        }

        // Add initial communication log
        await tx.communicationLog.create({
          data: {
            ticketId: newTicket.id,
            authorType: 'SYSTEM',
            authorName: 'System',
            message: `Ticket ${ticketNumber} created successfully`,
          }
        });

        return newTicket;
      });

      // Fetch the complete ticket with all relations
      const completeTicket = await this.ticketRepository.findById(ticket.id);

      // Create Miro board if service is initialized
      let miroBoardId: string | undefined;
      let miroBoardUrl: string | undefined;
      
      if (miroService.isInitialized()) {
        try {
          console.log(`Creating Miro board for ticket ${ticketNumber}`);
          
          // Create the board
          miroBoardId = await miroService.createBoard(completeTicket!);
          miroBoardUrl = `https://miro.com/app/board/${miroBoardId}/`;
          
          // Get brand info and attachments for board structure
          const brandInfo = Array.isArray(completeTicket!.brandInfo) && completeTicket!.brandInfo.length > 0 ? completeTicket!.brandInfo[0] : undefined;
          const attachments = completeTicket!.attachments;
          
          // Create board structure
          const boardStructure = await miroService.createBoardStructure(
            completeTicket!,
            miroBoardId,
            brandInfo,
            attachments
          );
          
          // Update ticket with Miro board information
          await this.ticketRepository.update(ticket.id, {
            miroBoardId,
            miroClientFrameId: boardStructure.clientInfoFrameId,
            miroDesignFrameId: boardStructure.designFrameId,
            miroReportFrameId: boardStructure.reportFrameId,
          });
          
          // Add communication log about Miro board creation
          await this.communicationLogRepository.create({
            ticket: { connect: { id: ticket.id } },
            authorType: 'SYSTEM',
            authorName: 'Miro Integration',
            message: `Miro board created successfully: ${miroBoardUrl}`,
          });
          
          console.log(`Miro board created successfully: ${miroBoardId}`);
          
        } catch (miroError) {
          console.error('Failed to create Miro board:', miroError);
          
          // Add communication log about Miro board creation failure
          await this.communicationLogRepository.create({
            ticket: { connect: { id: ticket.id } },
            authorType: 'SYSTEM',
            authorName: 'Miro Integration',
            message: `Failed to create Miro board: ${(miroError as Error).message}`,
          });
        }
      } else {
        console.log('Miro service not initialized, skipping board creation');
      }

      return {
        success: true,
        ticket: completeTicket!,
        miroBoardId,
        miroBoardUrl
      };

    } catch (error) {
      console.error('Error creating ticket:', error);
      return {
        success: false,
        errors: [{ field: 'general', message: 'Failed to create ticket. Please try again.' }]
      };
    }
  }

  /**
   * Get ticket by ID with all relations
   */
  async getTicketById(id: string): Promise<TicketWithRelations | null> {
    try {
      return await this.ticketRepository.findById(id);
    } catch (error) {
      console.error('Error fetching ticket by ID:', error);
      return null;
    }
  }

  /**
   * Get ticket by ticket number with all relations
   */
  async getTicketByNumber(ticketNumber: string): Promise<TicketWithRelations | null> {
    try {
      return await this.ticketRepository.findByTicketNumber(ticketNumber);
    } catch (error) {
      console.error('Error fetching ticket by number:', error);
      return null;
    }
  }

  /**
   * Get tickets by client ID
   */
  async getTicketsByClientId(clientId: string): Promise<TicketWithRelations[]> {
    try {
      const tickets = await this.ticketRepository.findByClientId(clientId);
      return tickets as TicketWithRelations[];
    } catch (error) {
      console.error('Error fetching tickets by client ID:', error);
      return [];
    }
  }

  /**
   * Validate service type
   */
  isValidServiceType(serviceType: string): serviceType is ServiceType {
    return Object.values(ServiceType).includes(serviceType as ServiceType);
  }

  /**
   * Validate priority
   */
  isValidPriority(priority: string): priority is Priority {
    return Object.values(Priority).includes(priority as Priority);
  }

  /**
   * Validate ticket status
   */
  isValidTicketStatus(status: string): status is TicketStatus {
    return Object.values(TicketStatus).includes(status as TicketStatus);
  }

  /**
   * Get service type display name
   */
  getServiceTypeDisplayName(serviceType: ServiceType): string {
    const displayNames = {
      [ServiceType.LOGO]: 'Logo Design',
      [ServiceType.WEBSITE]: 'Website Design',
      [ServiceType.BRANDING]: 'Branding Project'
    };
    return displayNames[serviceType];
  }

  /**
   * Get priority display name
   */
  getPriorityDisplayName(priority: Priority): string {
    const displayNames = {
      [Priority.NORMAL]: 'Normal',
      [Priority.HIGH]: 'High',
      [Priority.URGENT]: 'Urgent'
    };
    return displayNames[priority];
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(status: TicketStatus): string {
    const displayNames = {
      [TicketStatus.PENDING]: 'Pending',
      [TicketStatus.IN_PROGRESS]: 'In Progress',
      [TicketStatus.REVIEW]: 'Under Review',
      [TicketStatus.COMPLETED]: 'Completed'
    };
    return displayNames[status];
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.PENDING]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.REVIEW, TicketStatus.PENDING],
      [TicketStatus.REVIEW]: [TicketStatus.IN_PROGRESS, TicketStatus.COMPLETED],
      [TicketStatus.COMPLETED]: [] // No transitions from completed
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  /**
   * Update ticket status with validation and audit logging
   */
  async updateTicketStatus(
    ticketId: string, 
    statusData: TicketStatusUpdateData
  ): Promise<{ success: boolean; ticket?: TicketWithRelations; error?: string }> {
    try {
      // Get current ticket
      const currentTicket = await this.ticketRepository.findById(ticketId);
      if (!currentTicket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Validate status transition
      if (!this.isValidStatusTransition(currentTicket.status, statusData.status)) {
        return { 
          success: false, 
          error: `Invalid status transition from ${currentTicket.status} to ${statusData.status}` 
        };
      }

      // Update status with transaction
      const updatedTicket = await this.ticketRepository.withTransaction(async (tx) => {
        // Update ticket status
        const ticket = await tx.ticket.update({
          where: { id: ticketId },
          data: { 
            status: statusData.status,
            updatedAt: new Date()
          },
          include: {
            client: true,
            taskMappings: { orderBy: { taskOrder: 'asc' } },
            brandInfo: true,
            attachments: { orderBy: { uploadedAt: 'desc' } },
            communicationLogs: { orderBy: { createdAt: 'desc' } }
          }
        });

        // Add communication log for status change
        const statusMessage = statusData.comment 
          ? `Status changed to ${statusData.status}: ${statusData.comment}`
          : `Status changed to ${statusData.status}`;

        await tx.communicationLog.create({
          data: {
            ticketId,
            authorType: statusData.authorName ? 'DESIGNER' : 'SYSTEM',
            authorName: statusData.authorName || 'System',
            message: statusMessage,
          }
        });

        return ticket;
      });

      return { success: true, ticket: updatedTicket };

    } catch (error) {
      console.error('Error updating ticket status:', error);
      return { success: false, error: 'Failed to update ticket status' };
    }
  }

  /**
   * Get tickets with filtering and pagination
   */
  async getTicketsWithFilters(filters: {
    clientId?: string;
    status?: TicketStatus;
    serviceType?: ServiceType;
    priority?: Priority;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: TicketWithRelations[]; total: number }> {
    try {
      const whereClause: any = {};

      if (filters.clientId) {
        whereClause.clientId = filters.clientId;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.serviceType) {
        whereClause.serviceType = filters.serviceType;
      }

      if (filters.priority) {
        whereClause.priority = filters.priority;
      }

      // Get total count
      const total = await this.ticketRepository.count(whereClause);

      // Get tickets with pagination
      const tickets = await this.ticketRepository.withTransaction(async (tx) => {
        return await tx.ticket.findMany({
        where: whereClause,
        include: {
          client: true,
          taskMappings: { orderBy: { taskOrder: 'asc' } },
          brandInfo: true,
          attachments: { orderBy: { uploadedAt: 'desc' } },
          communicationLogs: { orderBy: { createdAt: 'desc' } }
        },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        });
      });

      return { tickets: tickets as TicketWithRelations[], total };

    } catch (error) {
      console.error('Error fetching tickets with filters:', error);
      return { tickets: [], total: 0 };
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(clientId?: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    review: number;
    completed: number;
  }> {
    try {
      const whereClause = clientId ? { clientId } : {};

      const [total, pending, inProgress, review, completed] = await Promise.all([
        this.ticketRepository.count(whereClause),
        this.ticketRepository.count({ ...whereClause, status: TicketStatus.PENDING }),
        this.ticketRepository.count({ ...whereClause, status: TicketStatus.IN_PROGRESS }),
        this.ticketRepository.count({ ...whereClause, status: TicketStatus.REVIEW }),
        this.ticketRepository.count({ ...whereClause, status: TicketStatus.COMPLETED })
      ]);

      return { total, pending, inProgress, review, completed };

    } catch (error) {
      console.error('Error fetching ticket statistics:', error);
      return { total: 0, pending: 0, inProgress: 0, review: 0, completed: 0 };
    }
  }

  /**
   * Update ticket details (title, description, deadline, priority)
   */
  async updateTicketDetails(
    ticketId: string,
    updates: {
      title?: string;
      description?: string;
      deadline?: Date;
      priority?: Priority;
    },
    authorName?: string
  ): Promise<{ success: boolean; ticket?: TicketWithRelations; errors?: TicketValidationError[] }> {
    try {
      // Validate updates
      const errors: TicketValidationError[] = [];

      if (updates.title !== undefined) {
        if (!updates.title || updates.title.trim() === '') {
          errors.push({ field: 'title', message: 'Title is required' });
        } else if (updates.title.length > 255) {
          errors.push({ field: 'title', message: 'Title must be 255 characters or less' });
        }
      }

      if (updates.description !== undefined && updates.description && updates.description.length > 5000) {
        errors.push({ field: 'description', message: 'Description must be 5000 characters or less' });
      }

      if (updates.deadline !== undefined && updates.deadline && updates.deadline <= new Date()) {
        errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
      }

      if (updates.priority !== undefined && !Object.values(Priority).includes(updates.priority)) {
        errors.push({ 
          field: 'priority', 
          message: `Priority must be one of: ${Object.values(Priority).join(', ')}` 
        });
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Update ticket
      const updatedTicket = await this.ticketRepository.withTransaction(async (tx) => {
        const updateData: any = { updatedAt: new Date() };

        if (updates.title !== undefined) {
          updateData.title = updates.title.trim();
        }
        if (updates.description !== undefined) {
          updateData.description = updates.description?.trim() || null;
        }
        if (updates.deadline !== undefined) {
          updateData.deadline = updates.deadline;
        }
        if (updates.priority !== undefined) {
          updateData.priority = updates.priority;
        }

        const ticket = await tx.ticket.update({
          where: { id: ticketId },
          data: updateData,
          include: {
            client: true,
            taskMappings: { orderBy: { taskOrder: 'asc' } },
            brandInfo: true,
            attachments: { orderBy: { uploadedAt: 'desc' } },
            communicationLogs: { orderBy: { createdAt: 'desc' } }
          }
        });

        // Log the update
        const changedFields = Object.keys(updates).join(', ');
        await tx.communicationLog.create({
          data: {
            ticketId,
            authorType: authorName ? 'DESIGNER' : 'SYSTEM',
            authorName: authorName || 'System',
            message: `Ticket details updated: ${changedFields}`,
          }
        });

        return ticket;
      });

      return { success: true, ticket: updatedTicket };

    } catch (error) {
      console.error('Error updating ticket details:', error);
      return { success: false, errors: [{ field: 'general', message: 'Failed to update ticket details' }] };
    }
  }

  /**
   * Validate file upload
   */
  private validateFileUpload(file: FileUploadData): { valid: boolean; error?: string } {
    // File size validation (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.mimeType)) {
      return { 
        valid: false, 
        error: 'File type not allowed. Supported types: images (JPEG, PNG, GIF, WebP, SVG), PDF, Word documents, and text files' 
      };
    }

    // File name validation
    if (!file.originalName || file.originalName.trim() === '') {
      return { valid: false, error: 'File name is required' };
    }

    if (file.originalName.length > 255) {
      return { valid: false, error: 'File name must be 255 characters or less' };
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
    const fileExtension = path.extname(file.originalName).toLowerCase();
    if (dangerousExtensions.includes(fileExtension)) {
      return { valid: false, error: 'File type not allowed for security reasons' };
    }

    return { valid: true };
  }

  /**
   * Generate secure file name
   */
  private generateSecureFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension)
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    
    return `${timestamp}_${randomBytes}_${baseName}${extension}`;
  }

  /**
   * Get upload directory path
   */
  private getUploadDirectory(): string {
    const uploadDir = process.env.UPLOAD_DIRECTORY || './uploads';
    return path.resolve(uploadDir);
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    const uploadDir = this.getUploadDirectory();
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
  }

  /**
   * Upload file attachment for ticket
   */
  async uploadAttachment(
    ticketId: string, 
    file: FileUploadData,
    authorName?: string
  ): Promise<AttachmentUploadResponse> {
    try {
      // Validate ticket exists
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Validate file
      const validation = this.validateFileUpload(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Ensure upload directory exists
      await this.ensureUploadDirectory();

      // Generate secure file name
      const secureFileName = this.generateSecureFileName(file.originalName);
      const uploadDir = this.getUploadDirectory();
      const filePath = path.join(uploadDir, secureFileName);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate file URL (this would typically be a CDN or static file server URL)
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const fileUrl = `${baseUrl}/uploads/${secureFileName}`;

      // Save attachment metadata to database
      const attachment = await this.attachmentRepository.withTransaction(async (tx) => {
        const newAttachment = await tx.attachment.create({
          data: {
            ticketId,
            fileName: file.originalName,
            fileUrl,
            fileType: file.mimeType,
          }
        });

        // Add communication log
        await tx.communicationLog.create({
          data: {
            ticketId,
            authorType: authorName ? 'CLIENT' : 'SYSTEM',
            authorName: authorName || 'System',
            message: `File uploaded: ${file.originalName}`,
          }
        });

        return newAttachment;
      });

      // Sync with Miro if it's an image and board exists
      if (file.mimeType.startsWith('image/')) {
        try {
          await this.addCommunicationToMiro(
            ticketId,
            `New image uploaded: ${file.originalName}`,
            authorName || 'System'
          );
        } catch (miroError) {
          console.warn('Failed to sync attachment with Miro:', miroError);
        }
      }

      return { success: true, attachment };

    } catch (error) {
      console.error('Error uploading attachment:', error);
      return { success: false, error: 'Failed to upload file. Please try again.' };
    }
  }

  /**
   * Get attachments for a ticket
   */
  async getTicketAttachments(ticketId: string): Promise<Attachment[]> {
    try {
      return await this.attachmentRepository.findMany({ ticketId });
    } catch (error) {
      console.error('Error fetching ticket attachments:', error);
      return [];
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(
    attachmentId: string, 
    authorName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get attachment details
      const attachment = await this.attachmentRepository.findById(attachmentId);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Extract file name from URL
      const fileName = path.basename(attachment.fileUrl);
      const filePath = path.join(this.getUploadDirectory(), fileName);

      // Delete from database and file system
      await this.attachmentRepository.withTransaction(async (tx) => {
        // Delete from database
        await tx.attachment.delete({
          where: { id: attachmentId }
        });

        // Add communication log
        await tx.communicationLog.create({
          data: {
            ticketId: attachment.ticketId,
            authorType: authorName ? 'CLIENT' : 'SYSTEM',
            authorName: authorName || 'System',
            message: `File deleted: ${attachment.fileName}`,
          }
        });
      });

      // Delete file from disk (don't fail if file doesn't exist)
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('Could not delete file from disk:', fileError);
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting attachment:', error);
      return { success: false, error: 'Failed to delete attachment' };
    }
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(attachmentId: string): Promise<Attachment | null> {
    try {
      return await this.attachmentRepository.findById(attachmentId);
    } catch (error) {
      console.error('Error fetching attachment:', error);
      return null;
    }
  }

  /**
   * Get file path for attachment (for serving files)
   */
  async getAttachmentFilePath(attachmentId: string): Promise<string | null> {
    try {
      const attachment = await this.attachmentRepository.findById(attachmentId);
      if (!attachment) {
        return null;
      }

      const fileName = path.basename(attachment.fileUrl);
      const filePath = path.join(this.getUploadDirectory(), fileName);

      // Check if file exists
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Error getting attachment file path:', error);
      return null;
    }
  }

  /**
   * Get attachment statistics for a ticket
   */
  async getAttachmentStatistics(ticketId: string): Promise<{
    count: number;
    totalSize: number;
    types: Record<string, number>;
  }> {
    try {
      const attachments = await this.attachmentRepository.findMany({ ticketId });
      
      const statistics = {
        count: attachments.length,
        totalSize: 0,
        types: {} as Record<string, number>
      };

      for (const attachment of attachments) {
        // Count by file type
        const fileType = attachment.fileType;
        statistics.types[fileType] = (statistics.types[fileType] || 0) + 1;

        // Calculate total size (would need to store file size in database for accurate calculation)
        // For now, we'll estimate based on file type
        const estimatedSize = this.estimateFileSize(attachment.fileType);
        statistics.totalSize += estimatedSize;
      }

      return statistics;

    } catch (error) {
      console.error('Error calculating attachment statistics:', error);
      return { count: 0, totalSize: 0, types: {} };
    }
  }

  /**
   * Estimate file size based on type (fallback when actual size not stored)
   */
  private estimateFileSize(fileType: string): number {
    const estimates: Record<string, number> = {
      'image/jpeg': 500000, // 500KB
      'image/png': 800000,  // 800KB
      'image/gif': 300000,  // 300KB
      'image/webp': 400000, // 400KB
      'image/svg+xml': 50000, // 50KB
      'application/pdf': 1000000, // 1MB
      'application/msword': 200000, // 200KB
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 300000, // 300KB
      'text/plain': 10000 // 10KB
    };

    return estimates[fileType] || 500000; // Default 500KB
  }

  /**
   * Add communication entry to Miro board
   */
  async addCommunicationToMiro(
    ticketId: string,
    message: string,
    author: string
  ): Promise<void> {
    try {
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket || !ticket.miroBoardId || !ticket.miroReportFrameId) {
        return;
      }

      if (miroService.isInitialized()) {
        await miroService.addCommunicationEntry(
          ticket.miroBoardId,
          ticket.miroReportFrameId,
          message,
          author,
          new Date()
        );
      }
    } catch (error) {
      console.error('Failed to add communication to Miro:', error);
    }
  }

  /**
   * Create Miro board for existing ticket (manual trigger)
   */
  async createMiroBoardForTicket(ticketId: string): Promise<{
    success: boolean;
    boardId?: string;
    boardUrl?: string;
    error?: string;
  }> {
    try {
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      if (ticket.miroBoardId) {
        return { 
          success: false, 
          error: 'Miro board already exists for this ticket',
          boardId: ticket.miroBoardId,
          boardUrl: `https://miro.com/app/board/${ticket.miroBoardId}/`
        };
      }

      if (!miroService.isInitialized()) {
        return { success: false, error: 'Miro service not initialized' };
      }

      // Create the board
      const miroBoardId = await miroService.createBoard(ticket);
      const miroBoardUrl = `https://miro.com/app/board/${miroBoardId}/`;
      
      // Get brand info and attachments for board structure
      const brandInfo = Array.isArray(ticket.brandInfo) && ticket.brandInfo.length > 0 ? ticket.brandInfo[0] : undefined;
      const attachments = ticket.attachments;
      
      // Create board structure
      const boardStructure = await miroService.createBoardStructure(
        ticket,
        miroBoardId,
        brandInfo,
        attachments
      );
      
      // Update ticket with Miro board information
      await this.ticketRepository.update(ticketId, {
        miroBoardId,
        miroClientFrameId: boardStructure.clientInfoFrameId,
        miroDesignFrameId: boardStructure.designFrameId,
        miroReportFrameId: boardStructure.reportFrameId,
      });
      
      // Add communication log
      await this.communicationLogRepository.create({
        ticket: { connect: { id: ticketId } },
        authorType: 'SYSTEM',
        authorName: 'Miro Integration',
        message: `Miro board created: ${miroBoardUrl}`,
      });

      return {
        success: true,
        boardId: miroBoardId,
        boardUrl: miroBoardUrl
      };

    } catch (error) {
      console.error('Failed to create Miro board for ticket:', error);
      return { 
        success: false, 
        error: `Failed to create Miro board: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Get Miro board information for a ticket
   */
  async getMiroBoardInfo(ticketId: string): Promise<{
    success: boolean;
    boardInfo?: any;
    boardUrl?: string;
    error?: string;
  }> {
    try {
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      if (!ticket.miroBoardId) {
        return { success: false, error: 'No Miro board associated with this ticket' };
      }

      if (!miroService.isInitialized()) {
        return { success: false, error: 'Miro service not initialized' };
      }

      const boardInfo = await miroService.getBoardInfo(ticket.miroBoardId);
      const boardUrl = `https://miro.com/app/board/${ticket.miroBoardId}/`;

      return {
        success: true,
        boardInfo,
        boardUrl
      };

    } catch (error) {
      console.error('Failed to get Miro board info:', error);
      return { 
        success: false, 
        error: `Failed to get board info: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Get task templates based on service type
   */
  getTaskTemplatesByServiceType(serviceType: ServiceType): Array<{ name: string; order: number; daysOffset: number }> {
    const templates = {
      [ServiceType.LOGO]: [
        { name: 'Análise do briefing', order: 1, daysOffset: 0 },
        { name: 'Pesquisa e moodboard', order: 2, daysOffset: 1 },
        { name: 'Conceitos iniciais (3 versões)', order: 3, daysOffset: 3 },
        { name: 'Revisão 1', order: 4, daysOffset: 5 },
        { name: 'Refinamento', order: 5, daysOffset: 7 },
        { name: 'Revisão final', order: 6, daysOffset: 9 },
        { name: 'Entrega de arquivos finais', order: 7, daysOffset: 10 }
      ],
      [ServiceType.WEBSITE]: [
        { name: 'Análise do briefing', order: 1, daysOffset: 0 },
        { name: 'Arquitetura de informação', order: 2, daysOffset: 2 },
        { name: 'Wireframes', order: 3, daysOffset: 5 },
        { name: 'Design de UI', order: 4, daysOffset: 10 },
        { name: 'Revisão do cliente', order: 5, daysOffset: 15 },
        { name: 'Ajustes finais', order: 6, daysOffset: 18 },
        { name: 'Entrega de arquivos', order: 7, daysOffset: 20 }
      ],
      [ServiceType.BRANDING]: [
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
   * Create task checkboxes in Miro board
   */
  async createMiroTaskCheckboxes(ticketId: string): Promise<{
    success: boolean;
    widgets?: Array<{ id: string; taskName: string; completed: boolean }>;
    error?: string;
  }> {
    try {
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      if (!ticket.miroBoardId || !ticket.miroReportFrameId) {
        return { success: false, error: 'Miro board not found for this ticket' };
      }

      if (!miroService.isInitialized()) {
        return { success: false, error: 'Miro service not initialized' };
      }

      // Get task templates for the service type
      const taskTemplates = this.getTaskTemplatesByServiceType(ticket.serviceType);
      
      // Create task checkboxes in Miro
      const widgets = await miroService.createTaskCheckboxes(
        ticket.miroBoardId,
        ticket.miroReportFrameId,
        taskTemplates
      );

      return {
        success: true,
        widgets
      };

    } catch (error) {
      console.error('Failed to create Miro task checkboxes:', error);
      return { 
        success: false, 
        error: `Failed to create task checkboxes: ${(error as Error).message}` 
      };
    }
  }
}