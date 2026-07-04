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
import { AiService } from './ai.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
