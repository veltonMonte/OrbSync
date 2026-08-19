import { Controller, Get, Post, UseGuards, Req, Res, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { GmailService } from './gmail.service';
import { google } from 'googleapis';

@Controller('gmail')
export class GmailController {
  private readonly logger = new Logger(GmailController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  async startAuth(@Req() req: any, @Res() res: any) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${frontendUrl}/configuracoes`
      );
      
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ];
      
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });
      
      return res.status(200).json({ url });
    } catch (error) {
      this.logger.error('Erro ao gerar URL de auth', error);
      return res.status(500).json({ url: '' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('callback')
  async callback(@Req() req: any, @Res() res: any) {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Código não fornecido' });

    try {
      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${frontendUrl}/configuracoes`
      );

      const { tokens } = await oauth2Client.getToken(code);
      
      await this.prisma.integration.upsert({
        where: {
          provider_userId: {
            provider: 'GOOGLE',
            userId: req.user.userId,
          },
        },
        update: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || '',
        },
        create: {
          provider: 'GOOGLE',
          userId: req.user.userId,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || '',
        },
      });

      this.logger.log(`Integração Gmail concluída para usuário ${req.user.userId}`);
      return res.status(200).json({ success: true, message: 'Conta conectada com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao conectar Gmail', error);
      return res.status(500).json({ success: false, message: 'Erro ao trocar o código por token' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('trigger')
  async triggerCron(@Req() req: any, @Res() res: any) {
    try {
      const integration = await this.prisma.integration.findUnique({
        where: { provider_userId: { provider: 'GOOGLE', userId: req.user.userId } }
      });
      if (!integration) {
        return res.status(400).json({ success: false, message: 'Nenhuma integração do Google encontrada.' });
      }

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

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      const gmailRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread category:primary newer_than:1d',
        maxResults: 5,
      });
      
      const messages = gmailRes.data.messages || [];
      if (messages.length === 0) {
        return res.status(200).json({ success: true, message: 'Nenhum e-mail não lido encontrado no Gmail.' });
      }

      // We will trigger the background job but let the user know we found emails
      this.gmailService.handleCron().catch(e => this.logger.error(e));
      return res.status(200).json({ success: true, message: `Encontrados ${messages.length} e-mails não lidos. Processando em segundo plano...` });
    } catch (error: any) {
      this.logger.error('Erro ao acionar cron do Gmail manualmente', error);
      return res.status(500).json({ success: false, message: 'Erro ao acessar Gmail: ' + error.message });
    }
  }
}
