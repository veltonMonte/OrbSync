import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto, authorId: string) {
    return this.prisma.comment.create({
      data: { ...dto, authorId },
      include: { author: true },
    });
  }

  async findAllByCard(cardId: string) {
    return this.prisma.comment.findMany({
      where: { cardId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!comment) {
      throw new NotFoundException(`Comentário com ID ${id} não encontrado`);
    }
    return comment;
  }

  async update(id: string, dto: UpdateCommentDto) {
    await this.findOne(id);
    return this.prisma.comment.update({
      where: { id },
      data: dto,
      include: { author: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.comment.delete({ where: { id } });
  }
}
