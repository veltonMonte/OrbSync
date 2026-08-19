import { Module } from '@nestjs/common';
import { ApiV1Controller } from './api-v1.controller';
import { ApiV1Service } from './api-v1.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolDispatcherService } from './tool-dispatcher.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApiV1Controller],
  providers: [ApiV1Service, ToolDispatcherService]
})
export class ApiV1Module {}
