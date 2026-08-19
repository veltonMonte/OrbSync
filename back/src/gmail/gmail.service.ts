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
    private readonly aiService: AiService,
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
      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${frontendUrl}/configuracoes`
      );
      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      let messages: any[] = [];
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Busca emails não lidos recentes
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread category:primary newer_than:1d',
        maxResults: 5,
      });
      messages = res.data.messages || [];

      for (const msg of messages) {
        let subject = 'Sem Assunto';
        let snippet = '';

        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });

        // Extrai assunto e corpo (simplificado)
        const headers = fullMsg.data.payload?.headers;
        subject = headers?.find((h: any) => h.name === 'Subject')?.value || 'Sem Assunto';
        snippet = fullMsg.data.snippet || '';

        // Marca como lido para não processar novamente
        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.id!,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao processar emails para usuário ${integration.userId}`, error);
    }
  }
}
