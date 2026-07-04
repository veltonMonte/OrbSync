import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsString()
  @IsNotEmpty()
  boardId: string;
}
