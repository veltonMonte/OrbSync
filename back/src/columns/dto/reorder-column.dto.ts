import { IsArray, IsString } from 'class-validator';

export class ReorderColumnDto {
  @IsArray()
  @IsString({ each: true })
  columnIds: string[];
}
