import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { AiService } from '../ai/ai.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
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

  async removeAllByUser(userId: string) {
    await this.prisma.notification.deleteMany({ where: { userId } });
  }

  async executeTask(id: string, userId: string, body?: any) {
    const notification = await this.prisma.notification.findUnique({ where: { id, userId } });
    if (!notification || !notification.linkUrl) return;

    let payload: any = null;
    try {
      payload = JSON.parse(notification.linkUrl);
    } catch (e) {
      return;
    }

    if (payload.type === 'TEAM_WHATSAPP_CONFIRM') {
      if (body?.answer === 'yes') {
        const targetPhone = payload.targetPhone && payload.targetPhone !== 'Equipe' ? payload.targetPhone : '5585999999999';
        await this.whatsappService.sendTextMessage('fluxionai', targetPhone, payload.message || notification.message);

      } else {
        console.log(`Envio de notificação WhatsApp para equipe cancelado pelo usuário ${userId}`);
      }
    } else if (payload.type === 'AI_LEAD_RESPONSE_PERMISSION') {
      if (body?.allowAiResponse) {
        console.log(`IA autorizada a responder leads para usuário ${userId}. Instrução: "${body?.responseInstruction || 'Descontraído'}"`);
        await this.prisma.systemLog.create({
          data: {
            level: 'INFO',
            module: 'AI_LEADS',
            message: `Permissão de resposta IA ativada: ${body?.responseInstruction || 'Padrão'}`,
            userId,
          },
        });
      } else {
        console.log(`Respostas automáticas de IA para leads desativadas pelo usuário ${userId}`);
      }
    } else if (payload.type === 'CREATE_CARD' && payload.data) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { workspaceMemberships: { include: { workspace: { include: { projects: { include: { boards: { include: { columns: { orderBy: { position: 'asc' }, take: 1 } } } } } } } } } }
      });

      const firstCol = user?.workspaceMemberships[0]?.workspace?.projects[0]?.boards[0]?.columns[0];
      if (firstCol) {
        await this.prisma.card.create({
          data: {
            title: payload.data.title || 'Nova Tarefa da IA',
            description: payload.data.description || '',
            columnId: firstCol.id,
            creatorId: userId,
          }
        });
      }
    } else if (payload.type === 'CREATE_DOC' && payload.data) {
      const generated = await this.aiService.generateDoc(payload.data.description || 'Criar documento', userId);
      
      await this.prisma.document.create({
        data: {
          title: payload.data.title || 'Novo Documento da IA',
          content: generated.html || payload.data.description || '',
          type: 'CUSTOM',
          authorId: userId,
        }
      });
    }

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }
}

