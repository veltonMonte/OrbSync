import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIntegrationDto, userId: string) {
    return this.prisma.integration.create({
      data: { ...dto, userId },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const integration = await this.prisma.integration.findUnique({ where: { id } });
    if (!integration) {
      throw new NotFoundException(`Integração com ID ${id} não encontrada`);
    }
    return integration;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.integration.delete({ where: { id } });
  }

  getGoogleAuthUrl(): string {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/integrations/google/callback'
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async handleGoogleCallback(code: string, userId: string) {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/integrations/google/callback'
    );

    let tokens;
    try {
      const { tokens: t } = await oauth2Client.getToken(code);
      tokens = t;
    } catch(e) {
      console.error('Error getting google tokens', e);
      throw new Error('Falha ao autenticar com o Google');
    }

    // Upsert the integration
    const existing = await this.prisma.integration.findFirst({
      where: { userId, provider: 'GOOGLE' }
    });

    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || existing.refreshToken,
        }
      });
    }

    return this.prisma.integration.create({
      data: {
        userId,
        provider: 'GOOGLE',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
      }
    });
  }
}
