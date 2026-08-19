import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly whatsappService: WhatsappService,
  ) {}

  private async assertColumnAccess(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: { include: { project: true } } },
    });
    if (!column) {
      throw new NotFoundException(`Coluna com ID ${columnId} não encontrada`);
    }
    if (column.board?.project?.workspaceId) {
      await this.workspacesService.assertMembership(column.board.project.workspaceId, userId);
    }
    return column;
  }

  private async assertCardAccess(cardId: string, userId?: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: { include: { project: true } } } },
        tags: { include: { tag: true } },
        assignee: true,
        creator: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!card) {
      throw new NotFoundException(`Card com ID ${cardId} não encontrado`);
    }
    if (userId && card.column?.board?.project?.workspaceId) {
      await this.workspacesService.assertMembership(card.column.board.project.workspaceId, userId);
    }
    return card;
  }

  async create(dto: CreateCardDto, userId: string) {
    await this.assertColumnAccess(dto.columnId, userId);

    const { tagIds, ...data } = dto;

    const card = await this.prisma.card.create({
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

    return card;
  }

  async findAllByColumn(columnId: string, userId: string) {
    await this.assertColumnAccess(columnId, userId);

    return this.prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
      },
    });
  }

  async findOne(id: string, userId?: string) {
    return this.assertCardAccess(id, userId);
  }

  async update(id: string, dto: UpdateCardDto, userId: string) {
    await this.assertCardAccess(id, userId);
    const { tagIds, ...data } = dto;

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

  async move(id: string, dto: MoveCardDto, userId: string) {
    const card = await this.assertCardAccess(id, userId);
    await this.assertColumnAccess(dto.targetColumnId, userId);
    const oldColumnId = card.columnId;
    const finalPosition = dto.position ?? dto.newPosition ?? 0;
    
    const updated = await this.prisma.card.update({
      where: { id },
      data: {
        columnId: dto.targetColumnId,
        position: finalPosition,
      },
      include: {
        tags: { include: { tag: true } },
        assignee: true,
      },
    });

    if (oldColumnId !== dto.targetColumnId) {
      const column = await this.prisma.column.findUnique({ 
        where: { id: dto.targetColumnId },
        include: { board: { include: { project: true } } }
      });

      // Notificar a equipe via WhatsApp sobre a movimentação da tarefa
      this.whatsappService.queueOrSendTeamNotification({
        userId,
        title: '📋 Movimentação no Kanban',
        message: `A tarefa "${card.title}" foi movida para a coluna "${column?.name || 'Nova Coluna'}".`,
        category: 'KANBAN',
      }).catch(console.error);
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.assertCardAccess(id, userId);
    await this.prisma.card.delete({ where: { id } });
  }
}
