import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: { members: { include: { user: true } }, projects: true },
    });
    if (!workspace) {
      throw new NotFoundException(`Workspace com ID ${id} não encontrado`);
    }
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    await this.findOne(id);
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.workspace.delete({ where: { id } });
  }

  async addMember(workspaceId: string, dto: AddMemberDto) {
    await this.findOne(workspaceId);
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    await this.prisma.workspaceMember.deleteMany({
      where: { workspaceId, userId },
    });
  }

  async getStats(id: string) {
    await this.findOne(id);
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

    return { projects: projectsCount, inProgress: inProgressCount, done: doneCount };
  }
}
