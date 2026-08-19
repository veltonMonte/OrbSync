import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async assertMembership(
    workspaceId: string,
    userId: string,
    requiredRole?: 'OWNER' | 'ADMIN' | 'MEMBER',
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Você não é membro deste workspace');
    }

    if (requiredRole === 'OWNER' && member.role !== 'OWNER') {
      throw new ForbiddenException('Ação permitida apenas para o proprietário do workspace');
    }

    if (requiredRole === 'ADMIN' && member.role !== 'OWNER' && member.role !== 'ADMIN') {
      throw new ForbiddenException('Ação permitida apenas para administradores do workspace');
    }

    return member;
  }

  async create(dto: CreateWorkspaceDto, userId: string) {
    return this.prisma.workspace.create({
      data: {
        ...dto,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: { members: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: { members: { include: { user: true } }, projects: true },
    });
    if (!workspace) {
      throw new NotFoundException(`Workspace com ID ${id} não encontrado`);
    }
    if (userId) {
      await this.assertMembership(id, userId);
    }
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto, userId: string) {
    await this.assertMembership(id, userId, 'ADMIN');
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.assertMembership(id, userId, 'OWNER');
    await this.prisma.workspace.delete({ where: { id } });
  }

  async addMember(workspaceId: string, dto: AddMemberDto, requestingUserId: string) {
    await this.assertMembership(workspaceId, requestingUserId, 'ADMIN');
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async removeMember(workspaceId: string, targetUserId: string, requestingUserId: string) {
    await this.assertMembership(workspaceId, requestingUserId, 'ADMIN');
    await this.prisma.workspaceMember.deleteMany({
      where: { workspaceId, userId: targetUserId },
    });
  }

  async getStats(id: string, userId: string) {
    await this.assertMembership(id, userId);
    const projectsCount = await this.prisma.project.count({ where: { workspaceId: id } });
    
    const doneCount = await this.prisma.card.count({
      where: { 
        column: { 
          name: { contains: 'Concluído', mode: 'insensitive' }, 
          board: { project: { workspaceId: id } } 
        } 
      }
    });
    
    const inProgressCount = await this.prisma.card.count({
      where: { 
        column: { 
          name: { contains: 'Progresso', mode: 'insensitive' }, 
          board: { project: { workspaceId: id } } 
        } 
      }
    });

    const projectsData = await this.prisma.project.findMany({
      where: { workspaceId: id },
      include: {
        boards: {
          include: {
            columns: {
              include: { _count: { select: { cards: true } } }
            }
          }
        }
      }
    });

    const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];
    const projectDistributionData = projectsData.map((proj, index) => {
      let totalCards = 0;
      proj.boards.forEach(b => {
        b.columns.forEach(c => {
          totalCards += c._count.cards;
        });
      });
      return {
        name: proj.name,
        value: totalCards,
        color: colors[index % colors.length]
      };
    }).filter(p => p.value > 0);

    if (projectDistributionData.length === 0) {
      projectDistributionData.push({ name: 'Sem tarefas', value: 1, color: '#4b5563' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const cardsLastWeek = await this.prisma.card.findMany({
      where: {
        column: { board: { project: { workspaceId: id } } },
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: { createdAt: true }
    });
    
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const activityMap = new Map<string, number>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      activityMap.set(days[d.getDay()], 0);
    }
    
    cardsLastWeek.forEach(card => {
      const dayName = days[card.createdAt.getDay()];
      if (activityMap.has(dayName)) {
        activityMap.set(dayName, activityMap.get(dayName)! + 1);
      }
    });
    
    const activityData = Array.from(activityMap.entries()).map(([name, tasks]) => ({ name, tasks }));

    return { 
      projects: projectsCount, 
      inProgress: inProgressCount, 
      done: doneCount,
      activityData,
      projectDistributionData
    };  }
}
