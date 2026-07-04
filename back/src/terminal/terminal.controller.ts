import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TerminalService } from './terminal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('terminal')
@UseGuards(JwtAuthGuard)
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

  @Get('info')
  getInfo() {
    return this.terminalService.getInfo();
  }

  @Post('execute')
  async execute(@Body() body: { command: string }, @Req() req: Request) {
    if (!body.command) return { stdout: '', stderr: '', error: 'No command provided' };
    const userId = (req as any).user?.userId;
    return this.terminalService.executeCommand(body.command, userId);
  }
}
