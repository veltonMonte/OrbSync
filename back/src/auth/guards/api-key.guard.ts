import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    const apiKeyHash = require('crypto').createHash('sha256').update(apiKey).digest('hex');

    const agent = await this.prisma.agent.findUnique({
      where: { apiKeyHash },
    });

    if (!agent) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Attach agent to the request object for use in controllers
    request.agent = agent;
    return true;
  }
}
