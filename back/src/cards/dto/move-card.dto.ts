import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MoveCardDto {
  @IsString()
  @IsNotEmpty()
  targetColumnId: string;

  @IsInt()
  @Min(0)
  position: number;
}
