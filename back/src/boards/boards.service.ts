import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: dto,
      include: { columns: true },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.board.findMany({
      where: { projectId },
      include: { columns: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: { tags: { include: { tag: true } }, assignee: true },
            },
          },
        },
      },
    });
    if (!board) {
      throw new NotFoundException(`Board com ID ${id} não encontrado`);
    }
    return board;
  }

  async update(id: string, dto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.board.delete({ where: { id } });
  }
}
