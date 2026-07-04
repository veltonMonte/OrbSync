import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @IsEnum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'])
  @IsOptional()
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsNotEmpty()
  columnId: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
