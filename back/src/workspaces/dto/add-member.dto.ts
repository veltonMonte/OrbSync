import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['OWNER', 'ADMIN', 'MEMBER'])
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}
