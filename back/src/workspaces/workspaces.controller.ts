import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.create(dto, userId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.remove(id, userId);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.addMember(id, dto, userId);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') targetUserId: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.removeMember(id, targetUserId, userId);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.workspacesService.getStats(id, userId);
  }
}
