import { IsArray, IsOptional, IsString } from 'class-validator';

export class MarkReadDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationIds?: string[];

  /** Se true, marca todas como lidas */
  markAll?: boolean;
}
