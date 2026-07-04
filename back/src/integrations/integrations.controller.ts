import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  create(@Body() dto: CreateIntegrationDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.integrationsService.create(dto, userId);
  }

  @Get('google/auth')
  getGoogleAuthUrl() {
    return { url: this.integrationsService.getGoogleAuthUrl() };
  }

  @Get('google/callback')
  async handleGoogleCallback(@Req() req: Request, @Query('code') code: string) {
    const userId = (req as any).user.userId;
    await this.integrationsService.handleGoogleCallback(code, userId);
    return { success: true, message: 'Gmail conectado com sucesso!' };
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.integrationsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }
}
