import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto, @Req() req: Request) {
    const authorId = (req as any).user.userId;
    return this.documentsService.create(dto, authorId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const authorId = (req as any).user.userId;
    return this.documentsService.findAllByAuthor(authorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.documentsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.documentsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.documentsService.remove(id, userId);
  }
}
