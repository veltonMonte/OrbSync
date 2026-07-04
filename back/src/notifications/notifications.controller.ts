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
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.notificationsService.findAllByUser(userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post('mark-read')
  markAsRead(@Req() req: Request, @Body() dto: MarkReadDto) {
    const userId = (req as any).user.userId;
    return this.notificationsService.markAsRead(userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
