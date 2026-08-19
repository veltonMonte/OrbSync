import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  create(@Body() dto: CreateCardDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.cardsService.create(dto, userId);
  }

  @Get()
  findAll(@Query('columnId') columnId: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.cardsService.findAllByColumn(columnId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.cardsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCardDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.cardsService.update(id, dto, userId);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveCardDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.cardsService.move(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.cardsService.remove(id, userId);
  }
}
