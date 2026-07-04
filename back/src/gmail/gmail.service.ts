import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { google } from 'googleapis';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('Verificando novos e-mails para usuários com integração Google...');
    const integrations = await this.prisma.integration.findMany({
      where: { provider: 'GOOGLE' },
    });

    for (const integration of integrations) {
      await this.processEmailsForUser(integration);
    }
  }

  private async processEmailsForUser(integration: any) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
        process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      );
      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      let messages: any[] = [];
      let gmail: any;

      if (integration.accessToken === 'mock_access_token') {
        this.logger.debug('Modo Mock ativado para Gmail. Gerando e-mails falsos...');
        messages = [
          {
            id: 'mock_msg_1',
            subject: 'Solicitação de Orçamento - Projeto X',
            snippet: 'Olá, gostaria de saber se você poderia me enviar um orçamento para a criação de um novo módulo no nosso sistema.'
          },
          {
            id: 'mock_msg_2',
            subject: 'Reunião semanal',
            snippet: 'Lembrando que nossa reunião semanal é amanhã às 10h.'
          }
        ];
      } else {
        gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        // Busca emails não lidos recentes
        const res = await gmail.users.messages.list({
          userId: 'me',
          q: 'is:unread',
          maxResults: 5,
        });
        messages = res.data.messages || [];
      }

      for (const msg of messages) {
        let subject = 'Sem Assunto';
        let snippet = '';

        if (integration.accessToken === 'mock_access_token') {
          subject = msg.subject;
          snippet = msg.snippet;
        } else {
          const fullMsg = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
          });

          // Extrai assunto e corpo (simplificado)
          const headers = fullMsg.data.payload?.headers;
          subject = headers?.find((h: any) => h.name === 'Subject')?.value || 'Sem Assunto';
          snippet = fullMsg.data.snippet;
        }

        // Analisa com IA se há uma tarefa
        const emailContent = `Assunto: ${subject}\nResumo: ${snippet}`;
        const analysis = await this.aiService.analyzeEmailForTasks(emailContent, integration.userId);

        if (analysis.hasTask) {
          // Cria notificação na plataforma
          await this.prisma.notification.create({
            data: {
              userId: integration.userId,
              type: 'SYSTEM',
              title: 'Nova tarefa encontrada no E-mail!',
              message: analysis.suggestedActionMessage || 'Tarefa identificada pela IA no Gmail.',
              // Guarda a ação em JSON no deep link (ou em outra tabela, para simplificar usaremos linkUrl ou message)
              linkUrl: JSON.stringify(analysis.actionPayload),
            },
          });
        }

        if (integration.accessToken !== 'mock_access_token') {
          // Marca como lido para não processar novamente
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id!,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar emails para usuário ${integration.userId}`, error);
    }
  }
}
