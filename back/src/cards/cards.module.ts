import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WorkspacesModule, WhatsappModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}

