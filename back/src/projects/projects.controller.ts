import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.projectsService.create(dto, userId);
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.projectsService.findAllByWorkspace(workspaceId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.projectsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.projectsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.projectsService.remove(id, userId);
  }
}
