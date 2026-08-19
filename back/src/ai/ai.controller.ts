import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpsertAiConfigDto } from './dto/upsert-ai-config.dto';
import { PreviewAutoLeadsDto, DispatchAutoLeadsDto, AutoSearchLeadsDto } from './dto/auto-leads.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ─── AI Provider Config ───────────────────────────────────────────────────

  @Get('config')
  getAiConfig(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.getAiConfig(userId);
  }

  @Post('config')
  upsertAiConfig(@Req() req: Request, @Body() dto: UpsertAiConfigDto) {
    const userId = (req as any).user.userId;
    return this.aiService.upsertAiConfig(userId, dto);
  }

  @Delete('config')
  deleteAiConfig(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.deleteAiConfig(userId);
  }

  // ─── Chats ────────────────────────────────────────────────────────────────

  @Post('chats')
  createChat(@Body() dto: CreateChatDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.createChat(dto, userId);
  }

  @Get('chats')
  findAllChats(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.findAllChats(userId);
  }

  @Get('chats/:id')
  findOneChat(@Param('id') id: string) {
    return this.aiService.findOneChat(id);
  }

  @Post('chats/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.sendMessage(id, dto, userId);
  }

  @Delete('chats/:id')
  deleteChat(@Param('id') id: string) {
    return this.aiService.deleteChat(id);
  }

  // ─── Generation ───────────────────────────────────────────────────────────

  @Post('generate-doc')
  generateDoc(@Body() body: { prompt: string }, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.generateDoc(body.prompt, userId);
  }

  @Post('generate-command')
  generateTerminalCommand(@Body() body: { prompt: string }, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.generateTerminalCommand(body.prompt, userId);
  }

  @SkipThrottle()
  @Post('generate-leads')
  async generateLeads(@Body() body: { niche: string, state: string, city: string, customScript?: string }, @Req() req: Request) {
    const userId = (req as any).user.userId;
    const cities = body.city.split(',').map((c: string) => c.trim()).filter(Boolean);
    let allLeads: any[] = [];
    
    for (const c of cities) {
      const leads = await this.aiService.generateLeads(body.niche, body.state, c, userId, body.customScript);
      allLeads = allLeads.concat(leads);
    }
    
    return allLeads;
  }

  @SkipThrottle()
  @Post('preview-auto-leads')
  previewAutoLeads(@Body() body: PreviewAutoLeadsDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.previewAutoLeads(body as any, userId);
  }

  @SkipThrottle()
  @Post('dispatch-auto-leads')
  dispatchAutoLeads(@Body() body: DispatchAutoLeadsDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.dispatchAutoLeads(body as any, userId);
  }

  @SkipThrottle()
  @Post('auto-search-leads')
  autoSearchLeads(@Body() body: AutoSearchLeadsDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.autoSearchAndOutreachLeads(body as any, userId);
  }



  // ─── Saved Leads ──────────────────────────────────────────────────────────

  @Post('leads/save')
  saveLead(@Body() body: any, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.saveLead(body, userId);
  }

  @Get('leads/saved')
  getSavedLeads(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.getSavedLeads(userId);
  }

  @Delete('leads/saved/:id')
  deleteSavedLead(@Param('id') id: string) {
    return this.aiService.deleteSavedLead(id);
  }

  @Get('leads/scheduled')
  getScheduledLeads(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.aiService.getScheduledLeads(userId);
  }

  @Delete('leads/scheduled/:id')
  deleteScheduledLead(@Param('id') id: string) {
    return this.aiService.deleteScheduledLead(id);
  }
}


