import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { CardsModule } from './cards/cards.module';
import { TagsModule } from './tags/tags.module';
import { CommentsModule } from './comments/comments.module';
import { AutomationsModule } from './automations/automations.module';
import { DocumentsModule } from './documents/documents.module';
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MetricsModule } from './metrics/metrics.module';
import { TerminalModule } from './terminal/terminal.module';
import { GmailModule } from './gmail/gmail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    BoardsModule,
    ColumnsModule,
    CardsModule,
    TagsModule,
    CommentsModule,
    AutomationsModule,
    DocumentsModule,
    AiModule,
    IntegrationsModule,
    NotificationsModule,
    MetricsModule,
    TerminalModule,
    ScheduleModule.forRoot(),
    GmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
