import { BaseRepository } from '../../core/api/base.repository';
import { ApiResponse } from '../../domain/dto/auth.dto';

export type EmailDeliveryStatus = 'Pending' | 'Sent' | 'Failed' | 'Abandoned';

export interface EmailSettingsDto {
  senderName: string;
  senderAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string | null;
  // The stored password is never returned -- only whether one exists. Same contract the courier
  // connection screen already works to.
  hasSmtpPassword: boolean;
  useSsl: boolean;
  usingPlatformDefault: boolean;
}

export interface UpdateEmailSettingsPayload {
  senderName: string;
  senderAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string | null;
  // Omitted to keep the stored password. An empty box must never erase a secret.
  smtpPassword?: string;
  useSsl: boolean;
}

export interface EmailTemplateSummaryDto {
  templateKey: string;
  subject: string;
  isEnabled: boolean;
}

export interface EmailTemplateDto extends EmailTemplateSummaryDto {
  htmlBody: string;
  availableTokens: string[];
}

export interface EmailDeliveryDto {
  id: number;
  templateKey: string;
  toAddress: string;
  subject: string;
  relatedOrderId: number | null;
  status: EmailDeliveryStatus;
  attemptCount: number;
  lastError: string | null;
  lastAttemptAtUtc: string | null;
  sentAtUtc: string | null;
}

export interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Human names for the backend's template keys, shared by the templates screen and the per-order
// notifications panel so the two never drift into calling the same message different things.
export const templateLabel: Record<string, string> = {
  'order.placed': 'Order confirmation',
  'order.placed.cod': 'Order confirmation (cash on delivery)',
  'payment.received': 'Payment received',
  'order.dispatched': 'Dispatch notice',
  'order.delivered': 'Delivery confirmation',
  'order.cancelled': 'Cancellation notice',
  'order.refunded': 'Refund notice',
  'order.returned': 'Return notice',
};

class NotificationsApi extends BaseRepository {
  constructor() { super('/notifications'); }

  async getSettings(): Promise<EmailSettingsDto> {
    const res = await this.get<ApiResponse<EmailSettingsDto>>('/email-settings');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async updateSettings(payload: UpdateEmailSettingsPayload): Promise<EmailSettingsDto> {
    const res = await this.put<ApiResponse<EmailSettingsDto>>('/email-settings', payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async revertToPlatformDefault(): Promise<void> {
    await this.delete('/email-settings');
  }

  async sendTest(toAddress: string): Promise<{ success: boolean; message: string | null }> {
    const res = await this.post<ApiResponse<{ success: boolean; message: string | null }>>(
      '/email-settings/test', { toAddress });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getTemplates(): Promise<EmailTemplateSummaryDto[]> {
    const res = await this.get<ApiResponse<EmailTemplateSummaryDto[]>>('/templates');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getTemplate(key: string): Promise<EmailTemplateDto> {
    const res = await this.get<ApiResponse<EmailTemplateDto>>(`/templates/${key}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async updateTemplate(key: string, payload: { subject: string; htmlBody: string; isEnabled: boolean }): Promise<EmailTemplateDto> {
    const res = await this.put<ApiResponse<EmailTemplateDto>>(`/templates/${key}`, payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getDeliveries(params: { status?: EmailDeliveryStatus; orderId?: number; page: number; pageSize: number }): Promise<PagedResultDto<EmailDeliveryDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<EmailDeliveryDto>>>('/deliveries', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async retryDelivery(id: number): Promise<EmailDeliveryDto> {
    const res = await this.post<ApiResponse<EmailDeliveryDto>>(`/deliveries/${id}/retry`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const notificationsApi = new NotificationsApi();
