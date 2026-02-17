import { IsString, IsNotEmpty } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  @IsNotEmpty()
  shareCode: string;
}
