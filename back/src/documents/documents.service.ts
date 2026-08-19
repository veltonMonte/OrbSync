import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async create(dto: CreateDocumentDto, authorId: string) {
    const document = await this.prisma.document.create({
      data: { ...dto, authorId },
    });

    this.whatsappService.queueOrSendTeamNotification({
      userId: authorId,
      title: '📄 Novo Documento da Equipe',
      message: `Novo documento criado: "${document.title}".`,
      category: 'DOCS',
    }).catch(console.error);

    return document;
  }

  async findAllByAuthor(authorId: string) {
    return this.prisma.document.findMany({
      where: { authorId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!document) {
      throw new NotFoundException(`Documento com ID ${id} não encontrado`);
    }
    if (userId && document.authorId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este documento');
    }
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    await this.findOne(id, userId);
    const updated = await this.prisma.document.update({ where: { id }, data: dto });

    this.whatsappService.queueOrSendTeamNotification({
      userId,
      title: '📝 Documento Atualizado',
      message: `O documento "${updated.title}" foi atualizado pela equipe.`,
      category: 'DOCS',
    }).catch(console.error);

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.document.delete({ where: { id } });
  }
}

