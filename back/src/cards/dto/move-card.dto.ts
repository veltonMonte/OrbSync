import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class MoveCardDto {
  @IsString()
  @IsNotEmpty()
  targetColumnId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  newPosition?: number;
}
