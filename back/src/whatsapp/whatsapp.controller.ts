import { Controller, Post, Get, Delete, Body, Param, Logger, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/create')
  async createInstance(@Body('instanceName') instanceName: string) {
    const name = instanceName || 'fluxionai';
    return this.whatsappService.createInstance(name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('instance/connect/:instanceName')
  async getQrCode(@Param('instanceName') instanceName: string) {
    return this.whatsappService.getQrCode(instanceName);
  }

  @UseGuards(JwtAuthGuard)
  @Get('instance/status/:instanceName')
  async getStatus(@Param('instanceName') instanceName: string) {
    return this.whatsappService.getConnectionStatus(instanceName);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('instance/logout/:instanceName')
  async logoutInstance(@Param('instanceName') instanceName: string) {
    return this.whatsappService.logoutInstance(instanceName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-text')
  async sendText(
    @Body('instanceName') instanceName: string,
    @Body('to') to: string,
    @Body('text') text: string,
  ) {
    return this.whatsappService.sendTextMessage(instanceName || 'fluxionai', to, text);
  }

  /**
   * Public Webhook endpoint for receiving events from Evolution API (no JwtAuthGuard)
   */
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    try {
      const event = payload?.event;
      this.logger.log(`Received Evolution API Webhook event: ${event}`);

      // Handle incoming messages
      if (event === 'messages.upsert' && !payload.data?.key?.fromMe) {
        const instanceName = payload.instance || 'fluxionai';
        const remoteJid = payload.data?.key?.remoteJid;
        const messageText = payload.data?.message?.conversation || 
                            payload.data?.message?.extendedTextMessage?.text;

        if (messageText && remoteJid) {
          this.logger.log(`WhatsApp message received from ${remoteJid}: "${messageText}"`);

          let aiResponseText = 'Olá! Sou o assistente com IA do FluxionIA. Como posso ajudar seu negócio hoje?';

          if (this.genAI) {
            try {
              const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
              const prompt = `Você é o assistente virtual com IA comercial da plataforma FluxionIA atuando via WhatsApp. 
Responda de forma profissional, amigável, clara e concisa (máximo 2 parágrafos).
Mensagem recebida do cliente: "${messageText}"`;
              const result = await model.generateContent(prompt);
              aiResponseText = result.response.text();
            } catch (err) {
              this.logger.error('Error generating AI response for WhatsApp webhook:', err);
            }
          }

          // Reply back via WhatsApp
          await this.whatsappService.sendTextMessage(instanceName, remoteJid, aiResponseText);
        }
      }

      return { status: 'SUCCESS' };
    } catch (error) {
      this.logger.error('Error processing WhatsApp webhook:', error);
      return { status: 'ERROR', message: String(error) };
    }
  }
}
