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
} from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post()
  create(@Body() dto: CreateAutomationDto) {
    return this.automationsService.create(dto);
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.automationsService.findAllByWorkspace(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.automationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAutomationDto) {
    return this.automationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.automationsService.remove(id);
  }
}
