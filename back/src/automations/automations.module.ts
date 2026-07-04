import { Module, forwardRef } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { AutomationEngineService } from './automations.engine';
import { TerminalModule } from '../terminal/terminal.module';

@Module({
  imports: [forwardRef(() => TerminalModule)],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationEngineService],
  exports: [AutomationsService, AutomationEngineService],
})
export class AutomationsModule {}
