import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['RESUME', 'REPORT', 'MEETING_NOTES', 'CUSTOM'])
  @IsOptional()
  type?: 'RESUME' | 'REPORT' | 'MEETING_NOTES' | 'CUSTOM';
}
