import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}
