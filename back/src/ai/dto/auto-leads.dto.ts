import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class PreviewAutoLeadsDto {
  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class DispatchAutoLeadsDto {
  @IsArray()
  @IsOptional()
  selectedLeads?: any[];

  @IsString()
  @IsOptional()
  outreachMessage?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}

export class AutoSearchLeadsDto {
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsString()
  @IsOptional()
  outreachMessage?: string;
}
