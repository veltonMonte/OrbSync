import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAutomationDto) {
    return this.prisma.automation.create({ data: dto });
  }

  async findAllByWorkspace(workspaceId: string) {
    return this.prisma.automation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const automation = await this.prisma.automation.findUnique({ where: { id } });
    if (!automation) {
      throw new NotFoundException(`Automação com ID ${id} não encontrada`);
    }
    return automation;
  }

  async update(id: string, dto: UpdateAutomationDto) {
    await this.findOne(id);
    return this.prisma.automation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.automation.delete({ where: { id } });
  }
}
