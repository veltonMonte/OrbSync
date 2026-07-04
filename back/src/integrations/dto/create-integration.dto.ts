import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateIntegrationDto {
  @IsEnum(['GITHUB', 'GITLAB', 'BITBUCKET'])
  provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET';

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
