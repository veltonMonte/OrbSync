import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolDispatcherService } from './tool-dispatcher.service';

@Injectable()
export class ApiV1Service {
  private readonly logger = new Logger(ApiV1Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolDispatcher: ToolDispatcherService,
  ) {}

  private async assertAgentAccess(agentId: string, userId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Agente com ID ${agentId} não encontrado`);
    }
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: agent.workspaceId }
      }
    });
    if (!membership) {
      throw new ForbiddenException('Você não tem permissão para gerenciar os agentes deste workspace');
    }
    return agent;
  }

  async registerAction(agentId: string, data: any) {
    this.logger.log(`Registering action for agent ${agentId}: ${data.name}`);
    return this.prisma.action.create({
      data: {
        agentId,
        name: data.name,
        description: data.description,
        method: data.method,
        endpointUrl: data.endpointUrl,
        headers: data.headers,
        schemaJson: data.schemaJson,
        requiresApproval: data.requiresApproval || false,
      },
    });
  }

  async handleEvent(agentId: string, data: any) {
    this.logger.log(`Handling event for agent ${agentId}: ${data.type}`);
    return { success: true, message: 'Event received and processed' };
  }

  async sendMessage(agentId: string, data: any) {
    this.logger.log(`Received message for agent ${agentId}: ${data.message}`);
    
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new Error('Agent not found');
    }

    const aiResponse = await this.toolDispatcher.processMessageAndExecuteActions(
      agent, 
      data.message, 
      data.history || []
    );

    return { 
      success: true, 
      response: aiResponse 
    };
  }

  async updateAgent(agentId: string, data: any, userId: string) {
    await this.assertAgentAccess(agentId, userId);
    this.logger.log(`Updating agent ${agentId} config`);
    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
        ...(data.planType !== undefined && { planType: data.planType }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      }
    });
    const { apiKeyHash, ...rest } = updated;
    return { ...rest, apiKey: `${updated.apiKeyPrefix}••••••••••••••••••••••••` };
  }

  async revokeAgent(agentId: string, userId: string) {
    await this.assertAgentAccess(agentId, userId);
    this.logger.log(`Revoking API Key ${agentId}`);
    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: 'REVOKED' }
    });
    const { apiKeyHash, ...rest } = updated;
    return { ...rest, apiKey: `${updated.apiKeyPrefix}••••••••••••••••••••••••` };
  }

  async generateAgent(data: { name: string, userId: string, planType: any, environment?: any, description?: string, permissions?: any }) {
    // We get the workspaceId from the user's membership to ensure it's valid
    const userWorkspace = await this.prisma.workspaceMember.findFirst({
      where: { userId: data.userId },
      select: { workspaceId: true }
    });
    
    if (!userWorkspace) {
      throw new Error('User does not belong to any workspace');
    }
    
    const workspaceId = userWorkspace.workspaceId;

    this.logger.log(`Generating new agent for workspace ${workspaceId}`);
    const rawKey = `flx_${data.environment === 'PRODUCTION' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const apiKeyPrefix = rawKey.substring(0, 12);
    const apiKeyHash = require('crypto').createHash('sha256').update(rawKey).digest('hex');
    
    const agent = await this.prisma.agent.create({
      data: {
        name: data.name,
        description: data.description,
        environment: data.environment || 'DEVELOPMENT',
        workspaceId,
        planType: data.planType || 'BASIC',
        apiKeyHash,
        apiKeyPrefix,
        permissions: data.permissions || { scopes: ['*'] }
      }
    });

    return { ...agent, apiKey: rawKey };
  }

  async listAgents(userId: string) {
    // Ideally we list agents for the workspaces the user belongs to
    // For MVP, just finding agents for the user's first workspace or all workspaces they are in
    const userWorkspaces = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true }
    });
    
    const workspaceIds = userWorkspaces.map(w => w.workspaceId);
    
    const agents = await this.prisma.agent.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: { _count: { select: { actions: true, customers: true, conversations: true } } }
    });

    return agents.map(a => {
      const { apiKeyHash, ...rest } = a;
      return { ...rest, apiKey: `${a.apiKeyPrefix}••••••••••••••••••••••••` };
    });
  }
}
