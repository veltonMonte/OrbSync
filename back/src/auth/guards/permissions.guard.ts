import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import * as crypto from 'crypto';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    // Hash the incoming key to compare with the DB
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const agent = await this.prisma.agent.findUnique({
      where: { apiKeyHash },
    });

    if (!agent) {
      this.logger.warn(`Invalid API Key attempt from IP: ${request.ip}`);
      throw new UnauthorizedException('Invalid API Key');
    }

    if (agent.status !== 'ACTIVE') {
      this.logger.warn(`Attempted to use revoked/inactive API Key: ${agent.id}`);
      throw new UnauthorizedException('API Key is no longer active');
    }

    if (agent.expiresAt && agent.expiresAt < new Date()) {
      this.logger.warn(`Attempted to use expired API Key: ${agent.id}`);
      throw new UnauthorizedException('API Key has expired');
    }

    // Attach agent to request
    request.agent = agent;

    // Async log the last used time
    this.prisma.agent.update({
      where: { id: agent.id },
      data: { lastUsedAt: new Date() }
    }).catch(e => this.logger.error('Failed to update lastUsedAt', e));

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No specific permissions required for this route, allow access
      return true;
    }

    // Parse agent permissions
    let agentPermissions: string[] = [];
    let allowedOrigins: string = '';
    
    if (agent.permissions) {
      try {
        const perms = typeof agent.permissions === 'string' ? JSON.parse(agent.permissions) : agent.permissions;
        if (Array.isArray(perms.scopes)) {
          agentPermissions = perms.scopes;
        }
        if (typeof perms.allowedOrigins === 'string') {
          allowedOrigins = perms.allowedOrigins.trim();
        }
      } catch (e) {
        this.logger.error('Failed to parse agent permissions', e);
      }
    }

    // IP/Origin Enforcement
    if (allowedOrigins) {
      const originsList = allowedOrigins.split(',').map(o => o.trim()).filter(o => o.length > 0);
      if (originsList.length > 0) {
        const incomingOrigin = request.headers.origin || request.headers.referer || '';
        const incomingIp = request.ip || request.connection.remoteAddress || '';
        
        const isAllowed = originsList.some(allowed => 
          incomingOrigin.includes(allowed) || incomingIp.includes(allowed)
        );

        if (!isAllowed) {
          this.logger.warn(`API Key ${agent.id} rejected due to Origin/IP restriction. Origin: ${incomingOrigin}, IP: ${incomingIp}`);
          throw new ForbiddenException('Access denied from this Origin/IP');
        }
      }
    }

    // Check if agent has ALL required permissions (or if they have 'all')
    const hasAccess = agentPermissions.includes('*') || requiredPermissions.every(rp => agentPermissions.includes(rp));

    // Log the access attempt
    await this.prisma.apiKeyLog.create({
      data: {
        agentId: agent.id,
        workspaceId: agent.workspaceId,
        permission: requiredPermissions.join(','),
        endpoint: request.url,
        method: request.method,
        result: hasAccess ? 'ALLOWED' : 'DENIED',
        ip: request.ip,
        userAgent: request.headers['user-agent']
      }
    });

    if (!hasAccess) {
      this.logger.warn(`Access denied for Agent ${agent.id} on ${request.method} ${request.url}. Missing permissions: ${requiredPermissions.join(',')}`);
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'API key does not have the required permission',
        requiredPermission: requiredPermissions.join(',')
      });
    }

    return true;
  }
}
