import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkReadDto } from './dto/mark-read.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, dto: MarkReadDto) {
    if (dto.markAll) {
      return this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    if (dto.notificationIds?.length) {
      return this.prisma.notification.updateMany({
        where: {
          id: { in: dto.notificationIds },
          userId,
        },
        data: { isRead: true },
      });
    }
  }

  async remove(id: string) {
    await this.prisma.notification.delete({ where: { id } });
  }
}
