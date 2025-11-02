import { config } from '../config/env';
import { Ticket } from '@prisma/client';

export interface MiroBoardStructure {
  boardId: string;
  clientInfoFrameId?: string;
  designFrameId?: string;
  reportFrameId?: string;
}

export interface MiroTaskWidget {
  id: string;
  taskName: string;
  completed: boolean;
}

export interface MiroWebhookEvent {
  type: string;
  data: {
    item: {
      id: string;
      type: string;
      data?: any;
    };
    board: {
      id: string;
    };
  };
}

export class MiroService {
  private baseUrl: string = 'https://api.miro.com/v2';
  private initialized: boolean = false;

  constructor() {
    this.initializeMiroClient();
  }

  private initializeMiroClient(): void {
    try {
      if (!config.miro.clientId || !config.miro.clientSecret) {
        console.warn('Miro credentials not configured. Miro integration will be disabled.');
        return;
      }

      this.initialized = true;
      console.log('Miro service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Miro service:', error);
      throw new Error('Miro service initialization failed');
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    accessToken?: string
  ): Promise<any> {
    const token = accessToken || config.miro.accessToken;
    if (!token) {
      throw new Error('Miro access token not provided');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Miro API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Miro API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  /**
   * Create a new Miro board for a ticket
   */
  async createBoard(ticket: Ticket, accessToken?: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Miro service not initialized');
    }

    try {
      const boardData = {
        name: `${ticket.ticketNumber} - ${ticket.title}`,
        policy: {
          permissionsPolicy: {
            collaborationToolsStartAccess: 'all_editors',
            copyAccess: 'anyone',
            sharingAccess: 'team_members_with_editing_rights'
          }
        }
      };

      const response = await this.makeRequest('/boards', 'POST', boardData, accessToken);
      
      console.log(`Created Miro board: ${response.id} for ticket: ${ticket.ticketNumber}`);
      return response.id;
    } catch (error: any) {
      console.error('Error creating Miro board:', error);
      
      // Handle rate limiting
      if (error?.message?.includes('429')) {
        throw new Error('Miro API rate limit exceeded. Please try again later.');
      }
      
      // Handle authentication errors
      if (error?.message?.includes('401')) {
        throw new Error('Miro authentication failed. Invalid or expired access token');
      }
      
      throw new Error(`Failed to create Miro board: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Create the complete board structure for a ticket
   */
  async createBoardStructure(
    ticket: Ticket, 
    boardId: string,
    brandInfo?: any,
    attachments?: any[],
    accessToken?: string
  ): Promise<MiroBoardStructure> {
    if (!this.initialized) {
      throw new Error('Miro service not initialized');
    }

    try {
      console.log(`Creating board structure for ticket ${ticket.ticketNumber} on board ${boardId}`);
      
      // Create main frames
      const clientInfoFrame = await this.createClientInfoFrame(boardId, ticket, brandInfo, accessToken);
      const designFrame = await this.createDesignFrame(boardId, ticket, accessToken);
      const reportFrame = await this.createReportFrame(boardId, ticket, accessToken);

      // Add visual references if attachments exist
      if (attachments && attachments.length > 0) {
        await this.addVisualReferences(boardId, clientInfoFrame.id, attachments, accessToken);
      }

      return {
        boardId,
        clientInfoFrameId: clientInfoFrame.id,
        designFrameId: designFrame.id,
        reportFrameId: reportFrame.id,
      };
    } catch (error: any) {
      console.error('Error creating board structure:', error);
      throw new Error(`Failed to create board structure: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Create client information frame
   */
  private async createClientInfoFrame(boardId: string, ticket: Ticket, brandInfo?: any, accessToken?: string) {
    // Create the main frame
    const frameData = {
      data: {
        title: `📋 CLIENT INFO - ${ticket.ticketNumber}`,
        format: 'custom',
        width: 800,
        height: 600,
      },
      position: { x: 0, y: 0 },
    };

    const frame = await this.makeRequest(`/boards/${boardId}/frames`, 'POST', frameData, accessToken);

    // Add client details sticky note
    const clientDetails = [
      `🎫 Ticket: ${ticket.ticketNumber}`,
      `📝 Project: ${ticket.title}`,
      `🎯 Service: ${ticket.serviceType}`,
      `⚡ Priority: ${ticket.priority}`,
      `📅 Deadline: ${ticket.deadline ? new Date(ticket.deadline).toLocaleDateString() : 'Not set'}`,
      `📊 Status: ${ticket.status}`,
    ].join('\n');

    const stickyNoteData = {
      data: {
        content: clientDetails,
        shape: 'square',
      },
      style: {
        fillColor: 'light_yellow',
        textAlign: 'left',
      },
      position: { x: 50, y: 50 },
      parent: { id: frame.id },
    };

    await this.makeRequest(`/boards/${boardId}/sticky_notes`, 'POST', stickyNoteData, accessToken);

    // Add project briefing
    if (ticket.description) {
      const textData = {
        data: {
          content: `<p><strong>📋 PROJECT BRIEFING</strong></p><p>${ticket.description}</p>`,
        },
        style: {
          color: '#1a1a1a',
          fontSize: 14,
          textAlign: 'left',
        },
        position: { x: 50, y: 200 },
        parent: { id: frame.id },
      };

      await this.makeRequest(`/boards/${boardId}/texts`, 'POST', textData, accessToken);
    }

    // Add brand guidelines if available
    if (brandInfo) {
      const brandContent = [
        '🎨 BRAND GUIDELINES',
        brandInfo.colors?.length ? `Colors: ${brandInfo.colors.join(', ')}` : '',
        brandInfo.fonts?.length ? `Fonts: ${brandInfo.fonts.join(', ')}` : '',
        brandInfo.styleKeywords?.length ? `Style: ${brandInfo.styleKeywords.join(', ')}` : '',
      ].filter(Boolean).join('\n');

      const brandStickyData = {
        data: {
          content: brandContent,
          shape: 'square',
        },
        style: {
          fillColor: 'light_blue',
          textAlign: 'left',
        },
        position: { x: 400, y: 50 },
        parent: { id: frame.id },
      };

      await this.makeRequest(`/boards/${boardId}/sticky_notes`, 'POST', brandStickyData, accessToken);
    }

    return frame;
  }

  /**
   * Create design workspace frame
   */
  private async createDesignFrame(boardId: string, ticket: Ticket, accessToken?: string) {
    const frameData = {
      data: {
        title: '🎨 DESIGN & REVISÕES',
        format: 'custom',
        width: 1200,
        height: 800,
      },
      position: { x: 900, y: 0 },
    };

    const frame = await this.makeRequest(`/boards/${boardId}/frames`, 'POST', frameData, accessToken);

    // Add instructions
    const textData = {
      data: {
        content: '<p><strong>💡 WORKSPACE INSTRUCTIONS</strong></p><p>Use this area for:</p><ul><li>Design concepts and iterations</li><li>Client feedback and revisions</li><li>Final design presentations</li></ul>',
      },
      style: {
        color: '#666666',
        fontSize: 12,
        textAlign: 'left',
      },
      position: { x: 50, y: 50 },
      parent: { id: frame.id },
    };

    await this.makeRequest(`/boards/${boardId}/texts`, 'POST', textData, accessToken);

    return frame;
  }

  /**
   * Create project report frame with task checkboxes
   */
  private async createReportFrame(boardId: string, ticket: Ticket, accessToken?: string) {
    const frameData = {
      data: {
        title: '📊 PROJECT REPORT',
        format: 'custom',
        width: 600,
        height: 800,
      },
      position: { x: 0, y: 700 },
    };

    const frame = await this.makeRequest(`/boards/${boardId}/frames`, 'POST', frameData, accessToken);

    // Add timeline info
    const timelineContent = [
      '📅 PROJECT TIMELINE',
      `Created: ${new Date(ticket.createdAt).toLocaleDateString()}`,
      `Deadline: ${ticket.deadline ? new Date(ticket.deadline).toLocaleDateString() : 'Not set'}`,
      `Status: ${ticket.status}`,
    ].join('\n');

    const timelineTextData = {
      data: {
        content: timelineContent,
      },
      style: {
        color: '#1a1a1a',
        fontSize: 12,
        textAlign: 'left',
      },
      position: { x: 50, y: 50 },
      parent: { id: frame.id },
    };

    await this.makeRequest(`/boards/${boardId}/texts`, 'POST', timelineTextData, accessToken);

    // Add communication log header
    const logTextData = {
      data: {
        content: '<p><strong>💬 COMMUNICATION LOG</strong></p><p>Updates and messages will appear here...</p>',
      },
      style: {
        color: '#666666',
        fontSize: 12,
        textAlign: 'left',
      },
      position: { x: 50, y: 200 },
      parent: { id: frame.id },
    };

    await this.makeRequest(`/boards/${boardId}/texts`, 'POST', logTextData, accessToken);

    return frame;
  }

  /**
   * Add visual references from attachments
   */
  private async addVisualReferences(boardId: string, frameId: string, attachments: any[], accessToken?: string) {
    let yOffset = 350;
    
    for (const attachment of attachments) {
      if (attachment.fileType.startsWith('image/')) {
        try {
          const imageData = {
            data: {
              url: attachment.fileUrl,
              title: attachment.fileName,
            },
            position: { x: 400, y: yOffset },
            parent: { id: frameId },
          };

          await this.makeRequest(`/boards/${boardId}/images`, 'POST', imageData, accessToken);
          yOffset += 150;
        } catch (error) {
          console.warn(`Failed to add image ${attachment.fileName}:`, error);
        }
      }
    }
  }

  /**
   * Create task checkboxes for project tracking
   */
  async createTaskCheckboxes(
    boardId: string,
    frameId: string,
    tasks: Array<{ name: string; order: number }>,
    accessToken?: string
  ): Promise<MiroTaskWidget[]> {
    if (!this.initialized) {
      throw new Error('Miro service not initialized');
    }

    try {
      const widgets: MiroTaskWidget[] = [];
      let yOffset = 300;

      for (const task of tasks) {
        const shapeData = {
          data: {
            shape: 'rectangle',
            content: `☐ ${task.name}`,
          },
          style: {
            fillColor: 'transparent',
            borderColor: '#333333',
            borderWidth: 1,
            fontSize: 12,
            textAlign: 'left',
          },
          position: { x: 50, y: yOffset },
          parent: { id: frameId },
        };

        const shape = await this.makeRequest(`/boards/${boardId}/shapes`, 'POST', shapeData, accessToken);

        widgets.push({
          id: shape.id,
          taskName: task.name,
          completed: false,
        });

        yOffset += 40;
      }

      return widgets;
    } catch (error: any) {
      console.error('Error creating task checkboxes:', error);
      throw new Error(`Failed to create task checkboxes: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Update task checkbox status
   */
  async updateTaskStatus(
    boardId: string,
    widgetId: string,
    completed: boolean,
    taskName: string,
    accessToken?: string
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Miro service not initialized');
    }

    try {
      const checkmark = completed ? '☑' : '☐';
      const content = `${checkmark} ${taskName}`;
      
      const updateData = {
        data: {
          content,
        },
        style: {
          fillColor: completed ? 'light_green' : 'transparent',
        },
      };

      await this.makeRequest(`/boards/${boardId}/shapes/${widgetId}`, 'PATCH', updateData, accessToken);

      console.log(`Updated task ${widgetId} to ${completed ? 'completed' : 'pending'}`);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      throw new Error(`Failed to update task status: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Add communication log entry
   */
  async addCommunicationEntry(
    boardId: string,
    frameId: string,
    message: string,
    author: string,
    timestamp: Date,
    accessToken?: string
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Miro service not initialized');
    }

    try {
      const logEntry = `[${timestamp.toLocaleString()}] ${author}: ${message}`;
      
      const textData = {
        data: {
          content: logEntry,
        },
        style: {
          color: '#666666',
          fontSize: 10,
          textAlign: 'left',
        },
        position: { x: 50, y: 250 + Math.random() * 100 }, // Random positioning for demo
        parent: { id: frameId },
      };

      await this.makeRequest(`/boards/${boardId}/texts`, 'POST', textData, accessToken);

      console.log(`Added communication entry to frame ${frameId}`);
    } catch (error: any) {
      console.error('Error adding communication entry:', error);
      throw new Error(`Failed to add communication entry: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Handle webhook events from Miro
   */
  async processWebhookEvent(event: MiroWebhookEvent): Promise<void> {
    try {
      console.log('Processing Miro webhook event:', event.type);
      
      switch (event.type) {
        case 'item_updated':
          await this.handleItemUpdated(event);
          break;
        case 'item_created':
          await this.handleItemCreated(event);
          break;
        default:
          console.log(`Unhandled Miro webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing Miro webhook event:', error);
      throw error;
    }
  }

  private async handleItemUpdated(event: MiroWebhookEvent): Promise<void> {
    // Handle task checkbox updates
    if (event.data.item.type === 'shape' && event.data.item.data?.content) {
      const content = event.data.item.data.content;
      const isCompleted = content.includes('☑');
      const taskName = content.replace(/^[☐☑]\s*/, ''); // Remove checkbox symbol
      
      console.log(`Task checkbox updated: ${event.data.item.id}, completed: ${isCompleted}, task: ${taskName}`);
      
      // This will be handled by the webhook route which will trigger sync
      // The webhook route has access to the sync service and task mapping repository
    }
  }

  private async handleItemCreated(event: MiroWebhookEvent): Promise<void> {
    console.log(`New item created in Miro: ${event.data.item.id}`);
    // Handle new items if needed
  }

  /**
   * Get board information
   */
  async getBoardInfo(boardId: string, accessToken?: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Miro service not initialized');
    }

    try {
      const board = await this.makeRequest(`/boards/${boardId}`, 'GET', undefined, accessToken);
      return board;
    } catch (error: any) {
      console.error('Error getting board info:', error);
      throw new Error(`Failed to get board info: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Health check for Miro service
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    if (!this.initialized) {
      return {
        status: 'error',
        message: 'Miro service not initialized - check credentials'
      };
    }

    try {
      // Simple check to see if we can access Miro API
      // In a real implementation, you might want to make a lightweight API call
      return {
        status: 'ok',
        message: 'Miro service is operational'
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Miro service error: ${(error as any)?.message || 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const miroService = new MiroService();