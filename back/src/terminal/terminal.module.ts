import { Module, forwardRef } from '@nestjs/common';
import { TerminalController } from './terminal.controller';
import { TerminalService } from './terminal.service';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [forwardRef(() => AutomationsModule)],
  controllers: [TerminalController],
  providers: [TerminalService],
  exports: [TerminalService]
})
export class TerminalModule {}
