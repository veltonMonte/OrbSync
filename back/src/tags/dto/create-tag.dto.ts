import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  color: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
