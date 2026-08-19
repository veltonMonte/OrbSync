import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async create(dto: CreateProjectDto, userId: string) {
    if (dto.workspaceId) {
      await this.workspacesService.assertMembership(dto.workspaceId, userId);
    }

    const project = await this.prisma.project.create({
      data: dto,
      include: { boards: true },
    });

    return project;
  }

  async findAllByWorkspace(workspaceId: string, userId: string) {
    await this.workspacesService.assertMembership(workspaceId, userId);

    return this.prisma.project.findMany({
      where: { workspaceId },
      include: { boards: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        boards: {
          include: {
            columns: {
              include: {
                cards: {
                  include: {
                    tags: { include: { tag: true } },
                    assignee: true,
                  },
                  orderBy: { position: 'asc' },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
    if (!project) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado`);
    }

    if (userId && project.workspaceId) {
      await this.workspacesService.assertMembership(project.workspaceId, userId);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.project.delete({ where: { id } });
  }
}
