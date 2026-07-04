import { Controller, Get, Post, UseGuards, Req, Res, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { GmailService } from './gmail.service';

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
    // Como não há GOOGLE_CLIENT_ID real, faremos um mock do OAuth
    // Em produção, isso redirecionaria para oauth2Client.generateAuthUrl(...)
    const mockRedirectUrl = `http://localhost:5173/automacoes?gmail_mock_code=mock_code_${req.user.userId}`;
    return res.status(200).json({ url: mockRedirectUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Get('callback')
  async callback(@Req() req: any, @Res() res: any) {
    // O mock recebe a chamada vinda do frontend (poderia ser via query)
    try {
      await this.prisma.integration.upsert({
        where: {
          provider_userId: {
            provider: 'GOOGLE',
            userId: req.user.userId,
          },
        },
        update: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        },
        create: {
          provider: 'GOOGLE',
          userId: req.user.userId,
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        },
      });

      this.logger.log(`Integração Gmail (Mock) concluída para usuário ${req.user.userId}`);
      return res.status(200).json({ success: true, message: 'Conta conectada com sucesso (Mock)' });
    } catch (error) {
      this.logger.error('Erro ao conectar Gmail', error);
      return res.status(500).json({ success: false, message: 'Erro ao salvar integração' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('trigger')
  async triggerCron(@Res() res: any) {
    // Exposing this for testing/demonstration purposes
    try {
      await this.gmailService.handleCron();
      return res.status(200).json({ success: true, message: 'Cron do Gmail executado com sucesso' });
    } catch (error) {
      this.logger.error('Erro ao acionar cron do Gmail manualmente', error);
      return res.status(500).json({ success: false, message: 'Erro ao executar cron' });
    }
  }
}
