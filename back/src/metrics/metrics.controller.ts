import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(@Req() req: Request, @Query() dto: QueryMetricsDto) {
    const userId = (req as any).user.userId;
    return this.metricsService.getByUser(userId, dto);
  }

  @Get('summary')
  getSummary(@Req() req: Request, @Query() dto: QueryMetricsDto) {
    const userId = (req as any).user.userId;
    return this.metricsService.getSummary(userId, dto);
  }
}
