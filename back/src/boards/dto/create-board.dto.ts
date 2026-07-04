import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;
}
