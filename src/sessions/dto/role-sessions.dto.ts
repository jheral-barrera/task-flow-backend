import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RoleSessionsDto {
  @IsEnum(Role)
  role: Role;
}
