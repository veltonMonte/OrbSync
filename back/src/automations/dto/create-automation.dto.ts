import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['CARD_MOVED', 'CARD_CREATED', 'DUE_DATE_REACHED', 'STATUS_CHANGED'])
  trigger: 'CARD_MOVED' | 'CARD_CREATED' | 'DUE_DATE_REACHED' | 'STATUS_CHANGED';

  @IsObject()
  actionRules: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
