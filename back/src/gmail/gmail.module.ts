import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { GmailController } from './gmail.controller';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}
