import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class QueryMetricsDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
