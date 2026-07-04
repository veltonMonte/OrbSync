import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnDto } from './dto/reorder-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateColumnDto) {
    return this.prisma.column.create({ data: dto });
  }

  async findAllByBoard(boardId: string) {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    if (!column) {
      throw new NotFoundException(`Coluna com ID ${id} não encontrada`);
    }
    return column;
  }

  async update(id: string, dto: UpdateColumnDto) {
    await this.findOne(id);
    return this.prisma.column.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.column.delete({ where: { id } });
  }

  async reorder(dto: ReorderColumnDto) {
    const updates = dto.columnIds.map((id, index) =>
      this.prisma.column.update({
        where: { id },
        data: { position: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }
}
