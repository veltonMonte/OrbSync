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
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  create(@Body() dto: CreateCardDto) {
    return this.cardsService.create(dto);
  }

  @Get()
  findAll(@Query('columnId') columnId: string) {
    return this.cardsService.findAllByColumn(columnId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(id, dto);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveCardDto) {
    return this.cardsService.move(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardsService.remove(id);
  }
}
