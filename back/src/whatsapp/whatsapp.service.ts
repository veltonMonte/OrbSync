import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiUrl = this.configService.get<string>('EVOLUTION_API_URL', 'http://localhost:8080');
    this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY', 'FLUXIONIA_SECRET_KEY_2026');
  }

  private get headers() {
    return {
      'Content-Type': 'application/json; charset=utf-8',
      'apikey': this.apiKey,
    };
  }


  /**
   * Queues a team WhatsApp notification for user authorization or auto-sends depending on permission settings.
   */
  async queueOrSendTeamNotification(params: {
    userId: string;
    title: string;
    message: string;
    targetPhone?: string;
    category: 'KANBAN' | 'DOCS' | 'GIT' | 'LEADS';
  }) {
    const { userId, title, message, targetPhone, category } = params;

    try {
      const payload = JSON.stringify({
        type: 'TEAM_WHATSAPP_CONFIRM',
        category,
        message,
        targetPhone: targetPhone || 'Equipe',
        actionType: 'choice',
      });

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title,
          message: `${message}`,
          isRead: false,
          linkUrl: payload,
        },
      });

      this.logger.log(`Notificação de equipe criada para o usuário ${userId}: ${title}`);
      return notification;
    } catch (error) {
      this.logger.error('Erro ao registrar notificação de equipe:', error);
      return null;
    }
  }

  /**
   * Creates a new WhatsApp instance in Evolution API
   */
  async createInstance(instanceName: string) {
    try {
      const response = await fetch(`${this.apiUrl}/instance/create`, {
        method: 'POST',
        headers: this.headers,
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          instanceName,
          token: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
      return await response.json();
    } catch (error: any) {
      this.logger.error(`Error creating instance ${instanceName}:`, error);
      return { status: 'ERROR', error: error?.name === 'TimeoutError' ? 'Tempo limite (timeout) atingido ao conectar à Evolution API' : 'Erro ao criar instância do WhatsApp' };
    }
  }

  /**
   * Fetches QR code Base64 / Pairing code for connecting WhatsApp
   */
  async getQrCode(instanceName: string) {
    try {
      const response = await fetch(`${this.apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: this.headers,
        signal: AbortSignal.timeout(8000),
      });
      return await response.json();
    } catch (error: any) {
      this.logger.error(`Error fetching QR code for ${instanceName}:`, error);
      return { instance: { state: 'close' }, error: error?.name === 'TimeoutError' ? 'Tempo limite (timeout) atingido ao obter QR code' : 'Falha na conexão com a Evolution API' };
    }
  }

  /**
   * Sends a text message to a WhatsApp number
   */
  async sendTextMessage(instanceName: string, to: string, text: string) {
    try {
      let cleanNumber = to.replace(/\D/g, '');
      // Auto-prefix Brazil country code (55) if standard DDD 10-11 digit format without 55
      if (cleanNumber.length >= 10 && cleanNumber.length <= 11 && !cleanNumber.startsWith('55')) {
        cleanNumber = `55${cleanNumber}`;
      }

      const normalizedText = (text || '').normalize('NFC');

      const response = await fetch(`${this.apiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: this.headers,
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          number: cleanNumber,
          options: {
            delay: 1200,
            presence: 'composing',
          },
          textMessage: {
            text: normalizedText,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data?.response?.message?.[0] || data?.message || data?.error || 'Erro na resposta da Evolution API';
        
        // Handle specifically the case where the number doesn't exist on WhatsApp
        if (data?.response?.message?.[0]?.exists === false) {
          this.logger.warn(`Número não possui WhatsApp ativo: ${data.response.message[0].number || cleanNumber}`);
        } else {
          this.logger.error(`Evolution API sendText error (${response.status}): ${JSON.stringify(data)}`);
        }
        
        return { status: 'ERROR', error: errorMsg, details: data };
      }

      return data;
    } catch (error: any) {
      const isTimeout = error?.name === 'TimeoutError';
      const msg = isTimeout 
        ? 'O servidor do WhatsApp (Evolution API) não respondeu a tempo (timeout de 8s).' 
        : 'Falha ao conectar com o servidor da Evolution API. Verifique se o serviço do WhatsApp está ativo.';
      this.logger.error(`Error sending message via ${instanceName}: ${error?.message || error}`);
      return { status: 'ERROR', error: msg };
    }
  }

  /**
   * Retrieves connection state of a WhatsApp instance
   */
  async getConnectionStatus(instanceName: string) {
    try {
      const response = await fetch(`${this.apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: this.headers,
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return { instance: { state: 'close' } };
      }
      return await response.json();
    } catch (error) {
      return { instance: { state: 'close' } };
    }
  }

  /**
   * Disconnects / Logout WhatsApp instance
   */
  async logoutInstance(instanceName: string) {
    try {
      const response = await fetch(`${this.apiUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: this.headers,
        signal: AbortSignal.timeout(8000),
      });
      return await response.json();
    } catch (error: any) {
      this.logger.error(`Error logging out instance ${instanceName}:`, error);
      return { status: 'ERROR', error: 'Erro ao desconectar instância do WhatsApp' };
    }
  }
}

