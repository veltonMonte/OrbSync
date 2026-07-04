import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUser(userId: string, dto: QueryMetricsDto) {
    return this.prisma.productivityMetric.findMany({
      where: {
        userId,
        date: {
          gte: new Date(dto.startDate),
          lte: new Date(dto.endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getSummary(userId: string, dto: QueryMetricsDto) {
    const metrics = await this.getByUser(userId, dto);

    const summary = {
      totalCardsCreated: 0,
      totalCardsCompleted: 0,
      totalCommentsAdded: 0,
      totalFocusMinutes: 0,
      daysTracked: metrics.length,
    };

    for (const m of metrics) {
      summary.totalCardsCreated += m.cardsCreated;
      summary.totalCardsCompleted += m.cardsCompleted;
      summary.totalCommentsAdded += m.commentsAdded;
      summary.totalFocusMinutes += m.focusMinutes;
    }

    return { metrics, summary };
  }
}
