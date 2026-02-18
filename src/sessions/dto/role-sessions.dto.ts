import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RoleSessionDto {
  @IsEnum(Role)
  role: Role;
}
