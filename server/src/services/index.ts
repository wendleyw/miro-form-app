// Repository exports
export { BaseRepository } from './base.repository';
export { ClientRepository } from './client.repository';
export { TicketRepository } from './ticket.repository';
export { TaskMappingRepository } from './task-mapping.repository';
export { BrandInfoRepository } from './brand-info.repository';
export { AttachmentRepository } from './attachment.repository';
export { CommunicationLogRepository } from './communication-log.repository';
export { WebhookEventRepository } from './webhook-event.repository';

// Service exports
export { ClientService } from './client.service';
export { TicketService } from './ticket.service';
export { MiroService, miroService } from './miro.service';
export { SyncService, syncService } from './sync.service';
// export { TodoistService, todoistService } from './todoist.service';
export { SupabaseIntegrationService, supabaseIntegrationService } from './supabase-integration.service';

// Type exports
export type {
  ClientCreateInput,
  ClientUpdateInput,
  ClientWhereInput,
} from './client.repository';

export type {
  TicketCreateInput,
  TicketUpdateInput,
  TicketWhereInput,
  TicketWithRelations,
} from './ticket.repository';

export type {
  TaskMappingCreateInput,
  TaskMappingUpdateInput,
  TaskMappingWhereInput,
} from './task-mapping.repository';

export type {
  BrandInfoCreateInput,
  BrandInfoUpdateInput,
  BrandInfoWhereInput,
} from './brand-info.repository';

export type {
  AttachmentCreateInput,
  AttachmentUpdateInput,
  AttachmentWhereInput,
} from './attachment.repository';

export type {
  CommunicationLogCreateInput,
  CommunicationLogUpdateInput,
  CommunicationLogWhereInput,
} from './communication-log.repository';

export type {
  WebhookEventCreateInput,
  WebhookEventUpdateInput,
  WebhookEventWhereInput,
} from './webhook-event.repository';

export type {
  ClientRegistrationData,
  ClientAuthenticationData,
  ClientRegistrationResponse,
} from './client.service';

export type {
  TicketSubmissionData,
  TicketValidationError,
  TicketCreationResponse,
  TicketStatusUpdateData,
  FileUploadData,
  AttachmentUploadResponse,
} from './ticket.service';

export type {
  MiroBoardStructure,
  MiroTaskWidget,
  MiroWebhookEvent,
} from './miro.service';

export type {
  SyncEvent,
  TaskSyncData,
  CommunicationSyncData,
} from './sync.service';

// export type {
//   TodoistProject,
//   TodoistTask,
//   TodoistComment,
//   TodoistWebhookEvent,
// } from './todoist.service';

export type {
  ProjectCreationData,
  ProjectIntegrationResult,
} from './supabase-integration.service';

// Repository instances for dependency injection
import { ClientRepository } from './client.repository';
import { TicketRepository } from './ticket.repository';
import { TaskMappingRepository } from './task-mapping.repository';
import { BrandInfoRepository } from './brand-info.repository';
import { AttachmentRepository } from './attachment.repository';
import { CommunicationLogRepository } from './communication-log.repository';
import { WebhookEventRepository } from './webhook-event.repository';

export const repositories = {
  client: new ClientRepository(),
  ticket: new TicketRepository(),
  taskMapping: new TaskMappingRepository(),
  brandInfo: new BrandInfoRepository(),
  attachment: new AttachmentRepository(),
  communicationLog: new CommunicationLogRepository(),
  webhookEvent: new WebhookEventRepository(),
} as const;

export type Repositories = typeof repositories;