import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { AutomationEngineService } from '../automations/automations.engine';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: AutomationEngineService,
  ) {}

  async create(dto: CreateCardDto) {
    const { tagIds, ...data } = dto;

    return this.prisma.card.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
        creator: true,
      },
    });
  }

  async findAllByColumn(columnId: string) {
    return this.prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
      },
    });
  }

  async findOne(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
        creator: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!card) {
      throw new NotFoundException(`Card com ID ${id} não encontrado`);
    }
    return card;
  }

  async update(id: string, dto: UpdateCardDto) {
    await this.findOne(id);
    const { tagIds, ...data } = dto;

    // If tagIds provided, replace all tags
    if (tagIds) {
      await this.prisma.cardTag.deleteMany({ where: { cardId: id } });
      if (tagIds.length > 0) {
        await this.prisma.cardTag.createMany({
          data: tagIds.map((tagId) => ({ cardId: id, tagId })),
        });
      }
    }

    return this.prisma.card.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
      },
    });
  }

  async move(id: string, dto: MoveCardDto) {
    const card = await this.findOne(id);
    const oldColumnId = card.columnId;
    
    const updated = await this.prisma.card.update({
      where: { id },
      data: {
        columnId: dto.targetColumnId,
        position: dto.position,
      },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
      },
    });

    if (oldColumnId !== dto.targetColumnId) {
      // Find workspaceId
      const column = await this.prisma.column.findUnique({ 
        where: { id: dto.targetColumnId },
        include: { board: { include: { project: true } } }
      });
      if (column?.board?.project?.workspaceId) {
        // Run engine in background (don't await so we don't block the request)
        this.engine.handleCardMoved(id, column.board.project.workspaceId, dto.targetColumnId).catch(console.error);
      }
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.card.delete({ where: { id } });
  }
}
