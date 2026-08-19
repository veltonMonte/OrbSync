import { Body, Controller, Post, UseGuards, Get, Req, Param } from '@nestjs/common';
import { ApiV1Service } from './api-v1.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentAgent } from '../auth/decorators/agent.decorator';
import type { Agent } from '@prisma/client';

@Controller('v1')
export class ApiV1Controller {
  constructor(private readonly apiV1Service: ApiV1Service) {}

  @UseGuards(PermissionsGuard)
  @RequirePermission('actions:create')
  @Post('actions')
  async registerAction(@CurrentAgent() agent: Agent, @Body() data: any) {
    return this.apiV1Service.registerAction(agent.id, data);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('events:create')
  @Post('events')
  async handleEvent(@CurrentAgent() agent: Agent, @Body() data: any) {
    return this.apiV1Service.handleEvent(agent.id, data);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('messages:send')
  @Post('messages')
  async sendMessage(@CurrentAgent() agent: Agent, @Body() data: any) {
    return this.apiV1Service.sendMessage(agent.id, data);
  }

  // --- Dashboard API (Protected by JWT) ---

  @UseGuards(JwtAuthGuard)
  @Post('agents/generate')
  async generateAgent(@Req() req: any, @Body() data: any) {
    return this.apiV1Service.generateAgent({ name: data.name, planType: data.planType, userId: req.user.userId, environment: data.environment, description: data.description, permissions: data.permissions });
  }

  @UseGuards(JwtAuthGuard)
  @Get('agents/list')
  async listAgents(@Req() req: any) {
    return this.apiV1Service.listAgents(req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('agents/update/:id')
  async updateAgentByDashboard(@Req() req: any, @Param('id') agentId: string, @Body() data: any) {
    return this.apiV1Service.updateAgent(agentId, data, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('agents/revoke/:id')
  async revokeAgentByDashboard(@Req() req: any, @Param('id') agentId: string) {
    return this.apiV1Service.revokeAgent(agentId, req.user.userId);
  }

  // --- Webhooks ---

  // Phase 4: WhatsApp / Channel Webhook Receiver (Public)
  // Usually authenticated via Meta Webhook verify token signature
  @Post('webhook/whatsapp')
  async receiveWhatsAppMessage(@Body() data: any) {
    // In production, verify Meta signature
    // Extract customer phone, message, find the correct agent
    // Then call `this.apiV1Service.sendMessage(agent.id, { message, ... })`
    return { success: true };
  }
}
